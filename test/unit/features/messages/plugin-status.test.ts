import {
  getLatestLogFile,
  getPluginStatus,
  parseLogLine,
} from '.opencode/plugins/features/messages/plugin-status';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { vi } from 'vitest';

vi.mock('fs', () => ({
  readdirSync: vi.fn(),
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(),
}));

vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/testuser'),
}));

// Get mocked functions with proper typing
const mockReaddirSync = readdirSync as unknown as ReturnType<typeof vi.fn>;
const mockExistsSync = existsSync as unknown as ReturnType<typeof vi.fn>;
const mockReadFileSync = readFileSync as unknown as ReturnType<typeof vi.fn>;
const mockHomedir = homedir as unknown as ReturnType<typeof vi.fn>;

describe('plugin-status - unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.XDG_DATA_HOME;
    mockHomedir.mockReturnValue('/home/testuser');
  });

  describe('getLatestLogFile', () => {
    it('returns null when log dir does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      const result = getLatestLogFile();
      expect(result).toBeNull();
    });

    it('returns null when no .log files', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['readme.txt', 'config.json'] as never);
      const result = getLatestLogFile();
      expect(result).toBeNull();
    });

    it('returns latest log file', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        '2026-04-01T120000.log',
        '2026-04-03T143022.log',
        'dev.log',
      ] as never);
      const result = getLatestLogFile();
      expect(result).toContain('2026-04-03T143022.log');
    });

    it('sorts dev.log to end', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        'dev.log',
        '2026-04-01T120000.log',
      ] as never);
      const result = getLatestLogFile();
      expect(result).toContain('2026-04-01T120000.log');
    });
  });

  describe('parseLogLine', () => {
    it('returns null for invalid line', () => {
      expect(parseLogLine('not a log line')).toBeNull();
    });

    it('returns null when service is not plugin', () => {
      const line =
        'INFO  2026-04-03T14:30:22 +50ms service=server message=test';
      expect(parseLogLine(line)).toBeNull();
    });

    it('parses valid plugin log line', () => {
      const line =
        'INFO  2026-04-03T14:30:22 +50ms service=plugin name=test-plugin loading plugin';
      const result = parseLogLine(line);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('INFO');
      expect(result!.name).toBe('test-plugin');
      expect(result!.message).toBe('loading plugin');
    });

    it('extracts tags correctly', () => {
      const line =
        'INFO  2026-04-03T14:30:22 +50ms service=plugin name=my-plugin path=/some/path pkg=some-pkg loading';
      const result = parseLogLine(line);
      expect(result!.name).toBe('my-plugin');
      expect(result!.path).toBe('/some/path');
      expect(result!.pkg).toBe('some-pkg');
    });

    it('handles error tag', () => {
      const line =
        'ERROR  2026-04-03T14:30:22 +50ms service=plugin name=test error=ModuleNotFound failed';
      const result = parseLogLine(line);
      expect(result!.error).toBe('ModuleNotFound');
    });

    it('returns null for empty string', () => {
      expect(parseLogLine('')).toBeNull();
    });
  });

  describe('getPluginStatus', () => {
    it('returns empty array when no log file', () => {
      mockExistsSync.mockReturnValue(false);
      const result = getPluginStatus();
      expect(result).toEqual([]);
    });

    it('returns empty array when file read fails', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['test.log'] as never);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('read error');
      });
      const result = getPluginStatus();
      expect(result).toEqual([]);
    });

    it('parses plugin entries from log', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['test.log'] as never);
      mockReadFileSync.mockReturnValue(
        'INFO  2026-04-03T14:30:22 +50ms service=plugin name=plugin1 loading plugin\n' +
          'ERROR  2026-04-03T14:30:22 +200ms service=plugin name=plugin2 error=Fail failed\n'
      );
      const result = getPluginStatus();
      expect(result.length).toBeGreaterThan(0);
    });

    it('filters non-plugin entries', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['test.log'] as never);
      mockReadFileSync.mockReturnValue(
        'INFO  2026-04-03T14:30:22 +50ms service=server message=not plugin\n' +
          'INFO  2026-04-03T14:30:22 +100ms service=plugin name=real-plugin loading\n'
      );
      const result = getPluginStatus();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('real-plugin');
    });

    it('extracts plugin name from path when name not present', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['test.log'] as never);
      mockReadFileSync.mockReturnValue(
        'INFO  2026-04-03T14:30:22 +50ms service=plugin path=/path/to/plugin loading plugin\n'
      );
      const result = getPluginStatus();
      expect(result[0].name).toBe('/path/to/plugin');
    });

    it('uses default name when no name/path/pkg', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['test.log'] as never);
      mockReadFileSync.mockReturnValue(
        'INFO  2026-04-03T14:30:22 +50ms service=plugin loading plugin\n'
      );
      const result = getPluginStatus();
      expect(result[0].name).toBe('unknown');
    });

    it('detects built-in plugins', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['test.log'] as never);
      mockReadFileSync.mockReturnValue(
        'INFO  2026-04-03T14:30:22 +50ms service=plugin name=internal-plugin loading internal plugin\n'
      );
      const result = getPluginStatus();
      expect(result[0].source).toBe('built-in');
    });

    it('marks failed plugins', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['test.log'] as never);
      mockReadFileSync.mockReturnValue(
        'ERROR  2026-04-03T14:30:22 +200ms service=plugin name=failed-plugin error=Err failed\n'
      );
      const result = getPluginStatus();
      expect(result[0].status).toBe('failed');
      expect(result[0].error).toBe('Err');
    });

    it('marks incompatible plugins', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['test.log'] as never);
      mockReadFileSync.mockReturnValue(
        'WARN  2026-04-03T14:30:22 +250ms service=plugin name=old-plugin incompatible plugin\n'
      );
      const result = getPluginStatus();
      expect(result[0].status).toBe('incompatible');
    });
  });
});
