import {
  getPluginStatus,
  getLatestLogFile,
} from '.opencode/plugins/features/messages/plugin-status';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  existsSync: vi.fn(),
}));

vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/testuser'),
}));

import { readFileSync, readdirSync, existsSync } from 'fs';
import { homedir } from 'os';

const mockReadFileSync = readFileSync as unknown as ReturnType<typeof vi.fn>;
const mockReaddirSync = readdirSync as unknown as ReturnType<typeof vi.fn>;
const mockExistsSync = existsSync as unknown as ReturnType<typeof vi.fn>;
const mockHomedir = homedir as unknown as ReturnType<typeof vi.fn>;

describe('plugin-status (integration)', () => {
  const sampleLog = [
    'INFO  2026-04-03T14:30:22 +50ms service=plugin name=opencode-hooks loading internal plugin',
    'INFO  2026-04-03T14:30:22 +100ms service=plugin path=npm:opencode-theme loading plugin',
    'INFO  2026-04-03T14:30:22 +150ms service=plugin path=npm:opencode-wakatime loading plugin',
    'ERROR  2026-04-03T14:30:22 +200ms service=plugin path=npm:opencode-broken error=ModuleNotFound failed to load plugin',
    'WARN  2026-04-03T14:30:22 +250ms service=plugin path=npm:old-plugin error=No server entrypoint plugin incompatible',
  ].join('\n');

  describe('getPluginStatus', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      delete process.env.XDG_DATA_HOME;
      mockHomedir.mockReturnValue('/home/testuser');
    });

    it('should return null when no .log files after filter', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['readme.txt', 'config.json'] as never);
      const result = getPluginStatus();
      expect(result).toEqual([]);
    });

    it('should skip non-plugin log entries', () => {
      const mixedLog = [
        'INFO  2026-04-03T14:30:22 +50ms service=server message=Server started',
        'INFO  2026-04-03T14:30:22 +100ms service=plugin name=opencode-hooks loading internal plugin',
        'INFO  2026-04-03T14:30:22 +150ms service=session message=Session created',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as never);
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
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as never);
      mockReadFileSync.mockReturnValue(malformedLog);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-plugin');
    });

    it('should return empty array when file read fails', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as never);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = getPluginStatus();
      expect(result).toEqual([]);
    });

    it('should use DEFAULT_SESSION_ID when no name path or pkg', () => {
      const logWithNoName = [
        'INFO  2026-04-03T14:30:22 +50ms service=plugin loading plugin',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as never);
      mockReadFileSync.mockReturnValue(logWithNoName);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('unknown');
    });

    it('should use entry.message when error tag is not present', () => {
      const logWithErrorNoTag = [
        'ERROR  2026-04-03T14:30:22 +200ms service=plugin name=test-plugin failed to load',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as never);
      mockReadFileSync.mockReturnValue(logWithErrorNoTag);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('failed');
      expect(result[0].error).toBe('failed to load');
    });

    it('should not overwrite existing plugin status with same name', () => {
      const logWithDuplicateNames = [
        'INFO  2026-04-03T14:30:22 +50ms service=plugin name=test-plugin loading plugin',
        'INFO  2026-04-03T14:30:22 +100ms service=plugin name=test-plugin loading plugin',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as never);
      mockReadFileSync.mockReturnValue(logWithDuplicateNames);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
    });
    it('should handle warn level without incompatible message', () => {
      const logWithWarnNoIncompatible = [
        'WARN  2026-04-03T14:30:22 +250ms service=plugin name=test-plugin some warning',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as never);
      mockReadFileSync.mockReturnValue(logWithWarnNoIncompatible);

      const result = getPluginStatus();

      expect(result).toHaveLength(0);
    });

    it('should sort files with dev.log and timestamped files', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        'dev.log',
        '2026-04-03T143022.log',
        '2026-04-02T120000.log',
      ] as never);
      mockReadFileSync.mockReturnValue(sampleLog);

      const result = getPluginStatus();

      expect(result.length).toBeGreaterThan(0);
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('2026-04-03T143022.log'),
        'utf-8'
      );
    });
  });

  describe('getLatestLogFile', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      delete process.env.XDG_DATA_HOME;
      mockHomedir.mockReturnValue('/home/testuser');
    });

    it('should sort dev.log to the end', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['other.log', 'dev.log', 'another.log']);
      mockReadFileSync.mockReturnValue(JSON.stringify({ logs: [] }));

      const result = getLatestLogFile();

      expect(result).toMatch(/other\.log$/);
    });
  });
});
