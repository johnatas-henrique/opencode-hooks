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
    'ERROR  2026-04-03T14:30:22 +200ms service=plugin path=npm:opencode-broken error=ModuleNotFound failed to load plugin',
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

    it('should return null when no .log files after filter', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['readme.txt', 'config.json'] as any);
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
        'ERROR  2026-04-03T14:30:22 +200ms service=plugin name=opencode-hooks error=ModuleNotFound failed to load plugin',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(logWithFailedAfterLoading);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('failed');
      expect(result[0].error).toBe('ModuleNotFound');
    });

    it('should detect built-in plugins by source field', () => {
      const logWithBuiltInAndUser = [
        'INFO  2026-04-03T14:30:22 +50ms service=plugin name=CodexAuthPlugin loading internal plugin',
        'INFO  2026-04-03T14:30:22 +100ms service=plugin path=npm:opencode-theme loading plugin',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(logWithBuiltInAndUser);

      const result = getPluginStatus();

      const builtIn = result.find((s) => s.name === 'CodexAuthPlugin');
      const user = result.find((s) => s.name === 'npm:opencode-theme');

      expect(builtIn?.source).toBe('built-in');
      expect(user?.source).toBe('user');
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

    it('should use default data directory when XDG_DATA_HOME not set', () => {
      delete process.env.XDG_DATA_HOME;
      mockHomedir.mockReturnValue('/home/testuser');
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(sampleLog);

      getPluginStatus();

      expect(mockReadFileSync).toHaveBeenCalledWith(
        '/home/testuser/.local/share/opencode/log/2026-04-03T143022.log',
        'utf-8'
      );
    });

    it('should sort multiple log files with dev.log correctly', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        'dev.log',
        '2026-04-03T143022.log',
        '2026-04-02T120000.log',
      ] as any);
      mockReadFileSync.mockReturnValue(sampleLog);

      getPluginStatus();

      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('2026-04-03T143022.log'),
        'utf-8'
      );
    });

    it('should use pkg when name and path are not available', () => {
      const logWithPkg = [
        'INFO  2026-04-03T14:30:22 +50ms service=plugin pkg=npm:some-plugin loading plugin',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(logWithPkg);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('npm:some-plugin');
      expect(result[0].source).toBe('user');
    });

    it('should use DEFAULT_SESSION_ID when no name path or pkg', () => {
      const logWithNoName = [
        'INFO  2026-04-03T14:30:22 +50ms service=plugin loading plugin',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(logWithNoName);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('unknown');
    });

    it('should handle log entry with ERROR level using entry.message when no error tag', () => {
      const logWithError = [
        'ERROR  2026-04-03T14:30:22 +200ms service=plugin name=test-plugin error=TestError test error',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(logWithError);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('failed');
      expect(result[0].error).toBe('TestError');
    });

    it('should use entry.message when error tag is not present', () => {
      const logWithErrorNoTag = [
        'ERROR  2026-04-03T14:30:22 +200ms service=plugin name=test-plugin failed to load',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
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
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
      mockReadFileSync.mockReturnValue(logWithDuplicateNames);

      const result = getPluginStatus();

      expect(result).toHaveLength(1);
    });

    it('should push dev.log to end when it is the only file', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['dev.log', '2026-04-03.log'] as any);
      mockReadFileSync.mockReturnValue(sampleLog);

      getPluginStatus();

      expect(mockReaddirSync).toHaveBeenCalled();
    });

    it('should handle warn level without incompatible message', () => {
      const logWithWarnNoIncompatible = [
        'WARN  2026-04-03T14:30:22 +250ms service=plugin name=test-plugin some warning',
      ].join('\n');

      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['2026-04-03T143022.log'] as any);
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
      ] as any);
      mockReadFileSync.mockReturnValue(sampleLog);

      const result = getPluginStatus();

      expect(result.length).toBeGreaterThan(0);
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('2026-04-03T143022.log'),
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
        {
          name: 'opencode-hooks',
          status: 'active' as const,
          source: 'user' as const,
        },
        {
          name: 'npm:opencode-theme',
          status: 'active' as const,
          source: 'user' as const,
        },
      ];

      const result = formatPluginStatus(statuses, 'user-only');

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
          source: 'user' as const,
        },
      ];

      const result = formatPluginStatus(statuses, 'user-only');

      expect(result).toContain('1 failed');
      expect(result).toContain('✗ npm:broken (ModuleNotFound)');
    });

    it('should format incompatible plugins', () => {
      const statuses = [
        {
          name: 'npm:old-plugin',
          status: 'incompatible' as const,
          source: 'user' as const,
        },
      ];

      const result = formatPluginStatus(statuses, 'user-only');

      expect(result).toContain('1 incompatible');
      expect(result).toContain('⚠ npm:old-plugin');
    });

    it('should format mixed statuses', () => {
      const statuses = [
        {
          name: 'opencode-hooks',
          status: 'active' as const,
          source: 'user' as const,
        },
        {
          name: 'npm:theme',
          status: 'active' as const,
          source: 'user' as const,
        },
        {
          name: 'npm:broken',
          status: 'failed' as const,
          error: 'Error',
          source: 'user' as const,
        },
        {
          name: 'npm:old',
          status: 'incompatible' as const,
          source: 'user' as const,
        },
      ];

      const result = formatPluginStatus(statuses, 'user-only');

      expect(result).toContain('4 active, 1 failed, 1 incompatible');
      expect(result).toContain('✓ opencode-hooks');
      expect(result).toContain('✓ npm:theme');
      expect(result).toContain('✗ npm:broken (Error)');
      expect(result).toContain('⚠ npm:old');
    });

    describe('displayMode - user-only', () => {
      it('should show only user plugins count', () => {
        const statuses = [
          {
            name: 'user-plugin-1',
            status: 'active' as const,
            source: 'user' as const,
          },
          {
            name: 'user-plugin-2',
            status: 'active' as const,
            source: 'user' as const,
          },
          {
            name: 'CodexAuthPlugin',
            status: 'active' as const,
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'user-only');

        expect(result).toContain('2 active');
        expect(result).toContain('user-plugin-1');
        expect(result).toContain('user-plugin-2');
        expect(result).not.toContain('CodexAuthPlugin');
      });

      it('should exclude built-in from failed list', () => {
        const statuses = [
          {
            name: 'user-plugin',
            status: 'failed' as const,
            error: 'Error',
            source: 'user' as const,
          },
          {
            name: 'CodexAuthPlugin',
            status: 'failed' as const,
            error: 'Error',
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'user-only');

        expect(result).toContain('1 failed');
        expect(result).toContain('user-plugin');
        expect(result).not.toContain('CodexAuthPlugin');
      });

      it('should not show failed section when only built-in failed', () => {
        const statuses = [
          {
            name: 'CodexAuthPlugin',
            status: 'failed' as const,
            error: 'Error',
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'user-only');

        expect(result).toContain('0 failed');
        expect(result).not.toContain('Failed:');
      });

      it('should not show incompatible section when only built-in incompatible', () => {
        const statuses = [
          {
            name: 'CodexAuthPlugin',
            status: 'incompatible' as const,
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'user-only');

        expect(result).toContain('0 incompatible');
        expect(result).not.toContain('Incompatible:');
      });

      it('should not show Active section when no user plugins active', () => {
        const statuses = [
          {
            name: 'CodexAuthPlugin',
            status: 'active' as const,
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'user-only');

        expect(result).toContain('0 active');
        expect(result).not.toContain('Active:');
      });

      it('should show failed plugin without error message', () => {
        const statuses = [
          {
            name: 'broken-plugin',
            status: 'failed' as const,
            source: 'user' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'user-only');

        expect(result).toContain('Failed:');
        expect(result).toContain('broken-plugin');
      });
    });

    describe('displayMode - user-separated', () => {
      it('should show user and built-in in separate sections', () => {
        const statuses = [
          {
            name: 'user-plugin',
            status: 'active' as const,
            source: 'user' as const,
          },
          {
            name: 'CodexAuthPlugin',
            status: 'active' as const,
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'user-separated');

        expect(result).toContain('Active (user):');
        expect(result).toContain('Active (built-in):');
        expect(result).toContain('user-plugin');
        expect(result).toContain('CodexAuthPlugin');
      });

      it('should show total count including built-in', () => {
        const statuses = [
          {
            name: 'user-plugin',
            status: 'active' as const,
            source: 'user' as const,
          },
          {
            name: 'CodexAuthPlugin',
            status: 'active' as const,
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'user-separated');

        expect(result).toContain('2 active');
      });

      it('should show failed section when failed plugins exist', () => {
        const statuses = [
          {
            name: 'user-plugin',
            status: 'active' as const,
            source: 'user' as const,
          },
          {
            name: 'broken-plugin',
            status: 'failed' as const,
            error: 'Error',
            source: 'user' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'user-separated');

        expect(result).toContain('Failed:');
        expect(result).toContain('broken-plugin');
      });

      it('should show incompatible section when incompatible plugins exist', () => {
        const statuses = [
          {
            name: 'user-plugin',
            status: 'active' as const,
            source: 'user' as const,
          },
          {
            name: 'old-plugin',
            status: 'incompatible' as const,
            source: 'user' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'user-separated');

        expect(result).toContain('Incompatible:');
        expect(result).toContain('old-plugin');
      });

      it('should show failed plugin without error', () => {
        const statuses = [
          {
            name: 'broken-plugin',
            status: 'failed' as const,
            source: 'user' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'user-separated');

        expect(result).toContain('Failed:');
        expect(result).toContain('broken-plugin');
      });
    });

    describe('displayMode - all-labeled', () => {
      it('should show all plugins with (user) label', () => {
        const statuses = [
          {
            name: 'user-plugin',
            status: 'active' as const,
            source: 'user' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'all-labeled');

        expect(result).toContain('user-plugin (user)');
      });

      it('should show all plugins with (built-in) label', () => {
        const statuses = [
          {
            name: 'CodexAuthPlugin',
            status: 'active' as const,
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'all-labeled');

        expect(result).toContain('CodexAuthPlugin (built-in)');
      });

      it('should show total count including all plugins', () => {
        const statuses = [
          {
            name: 'user-plugin',
            status: 'active' as const,
            source: 'user' as const,
          },
          {
            name: 'CodexAuthPlugin',
            status: 'active' as const,
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'all-labeled');

        expect(result).toContain('2 active');
      });

      it('should show failed section with labels when failed plugins exist', () => {
        const statuses = [
          {
            name: 'user-plugin',
            status: 'active' as const,
            source: 'user' as const,
          },
          {
            name: 'broken-plugin',
            status: 'failed' as const,
            error: 'Error',
            source: 'user' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'all-labeled');

        expect(result).toContain('Failed:');
        expect(result).toContain('(user)');
      });

      it('should show incompatible section with labels when incompatible plugins exist', () => {
        const statuses = [
          {
            name: 'user-plugin',
            status: 'active' as const,
            source: 'user' as const,
          },
          {
            name: 'old-plugin',
            status: 'incompatible' as const,
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'all-labeled');

        expect(result).toContain('Incompatible:');
        expect(result).toContain('old-plugin (built-in)');
      });

      it('should show failed plugin without error in all-labeled mode', () => {
        const statuses = [
          {
            name: 'broken-plugin',
            status: 'failed' as const,
            source: 'user' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'all-labeled');

        expect(result).toContain('Failed:');
        expect(result).toContain('broken-plugin (user)');
      });

      it('should use built-in label for failed in all-labeled mode', () => {
        const statuses = [
          {
            name: 'CodexAuthPlugin',
            status: 'failed' as const,
            error: 'Error',
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses, 'all-labeled');

        expect(result).toContain('(built-in)');
        expect(result).toContain('CodexAuthPlugin');
      });

      it('should use user label when source is undefined in all-labeled mode', () => {
        const statuses = [
          {
            name: 'old-plugin',
            status: 'incompatible' as const,
          },
        ] as any;

        const result = formatPluginStatus(statuses, 'all-labeled');

        expect(result).toContain('old-plugin (user)');
      });
    });

    describe('displayMode - default behavior', () => {
      it('should default to user-only when no mode specified', () => {
        const statuses = [
          {
            name: 'user-plugin',
            status: 'active' as const,
            source: 'user' as const,
          },
          {
            name: 'CodexAuthPlugin',
            status: 'active' as const,
            source: 'built-in' as const,
          },
        ];

        const result = formatPluginStatus(statuses);

        expect(result).toContain('1 active');
        expect(result).toContain('user-plugin');
        expect(result).not.toContain('CodexAuthPlugin');
      });
    });
  });
});
