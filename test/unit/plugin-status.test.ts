import {
  getPluginStatus,
  formatPluginStatus,
} from '../../.opencode/plugins/helpers/plugin-status';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
  existsSync: jest.fn(),
}));

jest.mock('os', () => ({
  homedir: jest.fn(() => '/home/testuser'),
}));

import { readFileSync, readdirSync, existsSync } from 'fs';
import { homedir } from 'os';

const mockReadFileSync = readFileSync as jest.MockedFunction<
  typeof readFileSync
>;
const mockReaddirSync = readdirSync as jest.MockedFunction<typeof readdirSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockHomedir = homedir as jest.MockedFunction<typeof homedir>;

describe('plugin-status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.XDG_DATA_HOME;
    mockHomedir.mockReturnValue('/home/testuser');
  });

  const sampleLog = [
    'INFO  2026-04-03T14:30:22 +50ms service=plugin name=opencode-hooks loading internal plugin',
    'INFO  2026-04-03T14:30:22 +100ms service=plugin path=npm:opencode-theme loading plugin',
    'INFO  2026-04-03T14:30:22 +150ms service=plugin path=npm:opencode-wakatime loading plugin',
    'ERROR 2026-04-03T14:30:22 +200ms service=plugin path=npm:opencode-broken error=ModuleNotFound failed to load plugin',
    'WARN  2026-04-03T14:30:22 +250ms service=plugin path=npm:old-plugin error=No server entrypoint plugin incompatible',
  ].join('\n');

  describe('getPluginStatus', () => {
    it('should return empty array when log directory does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      const result = getPluginStatus();
      expect(result).toEqual([]);
    });

    it('should return empty array when no log files exist', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([]);
      const result = getPluginStatus();
      expect(result).toEqual([]);
    });

    it('should parse active plugins from log', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(sampleLog);

      const result = getPluginStatus();

      const active = result.filter((s) => s.status === 'active');
      expect(active).toHaveLength(3);
      expect(active.map((s) => s.name)).toContain('opencode-hooks');
      expect(active.map((s) => s.name)).toContain('npm:opencode-theme');
      expect(active.map((s) => s.name)).toContain('npm:opencode-wakatime');
    });

    it('should parse failed plugins from log', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(sampleLog);

      const result = getPluginStatus();

      const failed = result.filter((s) => s.status === 'failed');
      expect(failed).toHaveLength(1);
      expect(failed[0].name).toBe('npm:opencode-broken');
      expect(failed[0].error).toBe('ModuleNotFound');
    });

    it('should parse incompatible plugins from log', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(sampleLog);

      const result = getPluginStatus();

      const incompatible = result.filter((s) => s.status === 'incompatible');
      expect(incompatible).toHaveLength(1);
      expect(incompatible[0].name).toBe('npm:old-plugin');
    });

    it('should override active status with failed when both exist', () => {
      const logWithFailedAfterLoading = [
        'INFO  2026-04-03T14:30:22 +50ms service=plugin name=opencode-hooks loading internal plugin',
        'ERROR 2026-04-03T14:30:22 +200ms service=plugin name=opencode-hooks error=ModuleNotFound failed to load plugin',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(logWithFailedAfterLoading);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('failed');
      expect(result[0].error).toBe('ModuleNotFound');
    });

    it('should skip non-plugin log entries', () => {
      const mixedLog = [
        'INFO  2026-04-03T14:30:22 +50ms service=server message=Server started',
        'INFO  2026-04-03T14:30:22 +100ms service=plugin name=opencode-hooks loading internal plugin',
        'INFO  2026-04-03T14:30:22 +150ms service=session message=Session created',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(mixedLog);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('opencode-hooks');
    });

    it('should handle malformed log lines gracefully', () => {
      const malformedLog = [
        'This is not a valid log line',
        '',
        'INFO  2026-04-03T14:30:22 +50ms service=plugin name=test-plugin loading plugin',
        'random garbage 12345',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(malformedLog);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-plugin');
    });

    it('should return empty array when file read fails', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = getPluginStatus();
      expect(result).toEqual([]);
    });

    it('should use dev.log when it is the only log file', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['dev.log'] as any);
      mockReadFileSync.mockReturnValue(sampleLog);

      const result = getPluginStatus();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should prefer timestamped log over dev.log', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        'dev.log',
        '2026-04-03T143022.log',
      ] as any);
      mockReadFileSync.mockReturnValue(sampleLog);

      getPluginStatus();

      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('2026-04-03T143022.log'),
        'utf-8'
      );
    });

    it('should use XDG_DATA_HOME when set', () => {
      process.env.XDG_DATA_HOME = '/custom/data';
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(sampleLog);

      getPluginStatus();

      expect(mockReadFileSync).toHaveBeenCalledWith(
        '/custom/data/opencode/log/2026-04-03T143022.log',
        'utf-8'
      );
    });
  });

  describe('formatPluginStatus', () => {
    it('should return message when no plugins detected', () => {
      const result = formatPluginStatus([]);
      expect(result).toBe('No plugins detected in logs');
    });

    it('should format active plugins correctly', () => {
      const statuses = [
        { name: 'opencode-hooks', status: 'active' as const },
        { name: 'npm:opencode-theme', status: 'active' as const },
      ];

      const result = formatPluginStatus(statuses);

      expect(result).toContain('2 active');
      expect(result).toContain('✓ opencode-hooks');
      expect(result).toContain('✓ npm:opencode-theme');
    });

    it('should format failed plugins with error message', () => {
      const statuses = [
        {
          name: 'npm:broken',
          status: 'failed' as const,
          error: 'ModuleNotFound',
        },
      ];

      const result = formatPluginStatus(statuses);

      expect(result).toContain('1 failed');
      expect(result).toContain('✗ npm:broken (ModuleNotFound)');
    });

    it('should format incompatible plugins', () => {
      const statuses = [
        { name: 'npm:old-plugin', status: 'incompatible' as const },
      ];

      const result = formatPluginStatus(statuses);

      expect(result).toContain('1 incompatible');
      expect(result).toContain('⚠ npm:old-plugin');
    });

    it('should format mixed statuses', () => {
      const statuses = [
        { name: 'opencode-hooks', status: 'active' as const },
        { name: 'npm:theme', status: 'active' as const },
        { name: 'npm:broken', status: 'failed' as const, error: 'Error' },
        { name: 'npm:old', status: 'incompatible' as const },
      ];

      const result = formatPluginStatus(statuses);

      expect(result).toContain('2 active, 1 failed, 1 incompatible');
      expect(result).toContain('✓ opencode-hooks');
      expect(result).toContain('✓ npm:theme');
      expect(result).toContain('✗ npm:broken (Error)');
      expect(result).toContain('⚠ npm:old');
    });
  });
});
