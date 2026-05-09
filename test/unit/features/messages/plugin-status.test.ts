import { describe, it, expect, vi } from 'vitest';

vi.mock('fs', async () => {
  const { createSyncMockFs } = await import('../../helpers/mock-fs');
  const mockFs = createSyncMockFs();
  return { ...mockFs, default: mockFs };
});

import fs from 'fs';

interface MockFsOptions {
  exists?: boolean;
  readdir?: string[];
  readFile?: string;
  readFileImpl?: () => never;
}

function setupMockFs(options: MockFsOptions = {}): void {
  vi.clearAllMocks();
  if (options.exists !== undefined) {
    vi.mocked(fs.existsSync).mockReturnValue(options.exists);
  }
  if (options.readdir !== undefined) {
    vi.mocked(fs.readdirSync).mockReturnValue(options.readdir as never);
  }
  if (options.readFile !== undefined) {
    vi.mocked(fs.readFileSync).mockReturnValue(options.readFile);
  }
  if (options.readFileImpl !== undefined) {
    vi.mocked(fs.readFileSync).mockImplementation(options.readFileImpl);
  }
}

import {
  getLatestLogFile,
  parseLogLine,
  getPluginStatus,
  formatPluginStatus,
} from '.opencode/plugins/features/messages/plugin-status';
import type { PluginStatus } from '.opencode/plugins/types/messages';

describe('parseLogLine', () => {
  it('parses valid plugin log line', () => {
    const line =
      'INFO 2026-01-15T14:30:00.000Z +0ms service=plugin name=test-plugin loading Plugin loaded';
    const result = parseLogLine(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('INFO');
    expect(result!.name).toBe('test-plugin');
    expect(result!.message).toBe('loading Plugin loaded');
  });

  it('returns null for non-matching line', () => {
    expect(parseLogLine('not a log line')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseLogLine('')).toBeNull();
  });

  it('returns null for non-plugin service', () => {
    const line = 'INFO 2026-01-15T14:30:00.000Z +0ms service=app loading App';
    expect(parseLogLine(line)).toBeNull();
  });

  it('parses line with path, pkg, and error tags', () => {
    const line =
      'ERROR 2026-01-15T14:30:00.000Z +0ms service=plugin name=my-plugin path=/home/test pkg=@scope/test error=timeout Failed to load';
    const result = parseLogLine(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('ERROR');
    expect(result!.name).toBe('my-plugin');
    expect(result!.path).toBe('/home/test');
    expect(result!.pkg).toBe('@scope/test');
    expect(result!.error).toBe('timeout');
    expect(result!.message).toBe('Failed to load');
  });

  it('parses WARN level line', () => {
    const line =
      'WARN 2026-01-15T14:30:00.000Z +0ms service=plugin name=legacy-plugin incompatible version';
    const result = parseLogLine(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('WARN');
    expect(result!.message).toBe('incompatible version');
  });

  it('parses DEBUG level line', () => {
    const line =
      'DEBUG 2026-01-15T14:30:00.000Z +0ms service=plugin name=test Debug info';
    const result = parseLogLine(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('DEBUG');
    expect(result!.name).toBe('test');
  });
});

describe('getPluginStatus', () => {
  it('returns empty array when log directory does not exist', () => {
    setupMockFs({ exists: false });
    const result = getPluginStatus();
    expect(result).toEqual([]);
  });

  it('returns empty array when no log files', () => {
    setupMockFs({ exists: true, readdir: [] });
    const result = getPluginStatus();
    expect(result).toEqual([]);
  });

  it('parses log file and returns plugin statuses', () => {
    setupMockFs({
      exists: true,
      readdir: ['plugin-2026-01-15.log'],
      readFile: [
        'INFO 2026-01-15T14:30:00.000Z +0ms service=plugin name=my-plugin loading loaded',
        'INFO 2026-01-15T14:30:01.000Z +0ms service=plugin name=other-plugin loading loaded',
      ].join('\n'),
    });

    const result = getPluginStatus();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('my-plugin');
    expect(result[0].status).toBe('active');
    expect(result[0].source).toBe('user');
    expect(result[1].name).toBe('other-plugin');
    expect(result[1].status).toBe('active');
  });

  it('marks ERROR entries as failed', () => {
    setupMockFs({
      exists: true,
      readdir: ['plugin-2026-01-15.log'],
      readFile: [
        'INFO 2026-01-15T14:30:00.000Z +0ms service=plugin name=good-plugin loading loaded',
        'ERROR 2026-01-15T14:30:01.000Z +0ms service=plugin name=bad-plugin error=timeout Failed',
      ].join('\n'),
    });

    const result = getPluginStatus();
    expect(result).toHaveLength(2);
    const bad = result.find((p) => p.name === 'bad-plugin');
    expect(bad).toBeDefined();
    expect(bad!.status).toBe('failed');
    expect(bad!.error).toBe('timeout');
  });

  it('marks WARN incompatible entries', () => {
    setupMockFs({
      exists: true,
      readdir: ['plugin-2026-01-15.log'],
      readFile: [
        'WARN 2026-01-15T14:30:00.000Z +0ms service=plugin name=legacy incompatible version',
      ].join('\n'),
    });

    const result = getPluginStatus();
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('incompatible');
    expect(result[0].error).toBe('incompatible version');
  });

  it('marks internal plugin entries as built-in', () => {
    setupMockFs({
      exists: true,
      readdir: ['plugin-2026-01-15.log'],
      readFile: [
        'INFO 2026-01-15T14:30:00.000Z +0ms service=plugin name=@opencode/internal loading internal plugin',
      ].join('\n'),
    });

    const result = getPluginStatus();
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('built-in');
  });

  it('uses path when name is missing', () => {
    setupMockFs({
      exists: true,
      readdir: ['plugin-2026-01-15.log'],
      readFile: [
        'INFO 2026-01-15T14:30:00.000Z +0ms service=plugin path=/custom/path loading loaded',
      ].join('\n'),
    });

    const result = getPluginStatus();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('/custom/path');
  });

  it('returns empty array on readFile error', () => {
    setupMockFs({
      exists: true,
      readdir: ['plugin-2026-01-15.log'],
      readFileImpl: () => {
        throw new Error('permission denied');
      },
    });

    const result = getPluginStatus();
    expect(result).toEqual([]);
  });

  it('deduplicates by name, keeping latest status', () => {
    setupMockFs({
      exists: true,
      readdir: ['plugin-2026-01-15.log'],
      readFile: [
        'INFO 2026-01-15T14:30:00.000Z +0ms service=plugin name=my-plugin loading loaded',
        'ERROR 2026-01-15T14:30:01.000Z +0ms service=plugin name=my-plugin error=crash Failed',
      ].join('\n'),
    });

    const result = getPluginStatus();
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('failed');
  });
});

describe('getLatestLogFile', () => {
  beforeEach(() => {
    vi.stubEnv('XDG_DATA_HOME', '/fake/xdg');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns null if log directory does not exist', () => {
    setupMockFs({ exists: false });
    const result = getLatestLogFile();
    expect(result).toBeNull();
  });

  it('returns null if no .log files', () => {
    setupMockFs({ exists: true, readdir: ['readme.txt'] });
    const result = getLatestLogFile();
    expect(result).toBeNull();
  });

  it('returns path to latest log file', () => {
    setupMockFs({
      exists: true,
      readdir: ['plugin-2026-01-15.log', 'plugin-2026-01-14.log'],
    });
    const result = getLatestLogFile();
    expect(result).toMatch(/plugin-2026-01-15\.log$/);
  });

  it('sorts dev.log last', () => {
    setupMockFs({
      exists: true,
      readdir: ['dev.log', 'plugin-2026-01-15.log'],
    });
    const result = getLatestLogFile();
    expect(result).toMatch(/plugin-2026-01-15\.log$/);
  });
});

describe('formatPluginStatus', () => {
  const userActive: PluginStatus = {
    name: 'my-plugin',
    status: 'active',
    source: 'user',
  };
  const builtInActive: PluginStatus = {
    name: '@opencode/internal',
    status: 'active',
    source: 'built-in',
  };
  const failed: PluginStatus = {
    name: 'bad-plugin',
    status: 'failed',
    error: 'timeout',
    source: 'user',
  };
  const incompatible: PluginStatus = {
    name: 'legacy',
    status: 'incompatible',
    source: 'user',
  };
  const builtInFailed: PluginStatus = {
    name: '@opencode/legacy',
    status: 'failed',
    error: 'oom',
    source: 'built-in',
  };

  it('returns "No plugins" message for empty array', () => {
    expect(formatPluginStatus([])).toBe('No plugins detected in logs');
  });

  it('formats user-only mode correctly', () => {
    const result = formatPluginStatus(
      [userActive, builtInActive, failed],
      'user-only'
    );
    expect(result).toContain('Plugins: 2 active');
    expect(result).toContain('✓ my-plugin');
    expect(result).not.toContain('@opencode/internal');
    expect(result).toContain('✗ bad-plugin');
  });

  it('formats user-separated mode correctly', () => {
    const result = formatPluginStatus(
      [userActive, builtInActive, failed],
      'user-separated'
    );
    expect(result).toContain('Active (user):');
    expect(result).toContain('Active (built-in):');
    expect(result).toContain('✓ @opencode/internal');
    expect(result).toContain('✓ my-plugin');
    expect(result).toContain('Failed:');
    expect(result).toContain('✗ bad-plugin (timeout)');
  });

  it('formats all-labeled mode correctly', () => {
    const result = formatPluginStatus(
      [userActive, builtInActive, failed, builtInFailed, incompatible],
      'all-labeled'
    );
    expect(result).toContain('Active:');
    expect(result).toContain('✓ my-plugin (user)');
    expect(result).toContain('✓ @opencode/internal (built-in)');
    expect(result).toContain('Failed:');
    expect(result).toContain('✗ bad-plugin (timeout) (user)');
    expect(result).toContain('✗ @opencode/legacy (oom) (built-in)');
    expect(result).toContain('Incompatible:');
    expect(result).toContain('⚠ legacy (user)');
  });

  it('defaults to user-only display mode', () => {
    const result = formatPluginStatus([userActive, builtInActive]);
    expect(result).not.toContain('built-in');
  });

  it('shows incompatible section when present', () => {
    const result = formatPluginStatus([userActive, incompatible], 'user-only');
    expect(result).toContain('Incompatible:');
    expect(result).toContain('⚠ legacy');
  });

  it('shows error details for failed plugins', () => {
    const result = formatPluginStatus([failed], 'user-only');
    expect(result).toContain('(timeout)');
  });

  it('shows incompatible section in user-separated mode', () => {
    const result = formatPluginStatus(
      [userActive, builtInActive, failed, incompatible],
      'user-separated'
    );
    expect(result).toContain('Incompatible:');
    expect(result).toContain('⚠ legacy');
  });

  it('handles user-only mode with failed plugin but no error property', () => {
    const failedNoError: PluginStatus = {
      name: 'some-plugin',
      status: 'failed',
      source: 'user',
    };
    const result = formatPluginStatus([failedNoError], 'user-only');
    expect(result).toContain('✗ some-plugin');
  });

  it('handles user-separated mode with all sections present', () => {
    const result = formatPluginStatus(
      [userActive, builtInActive, failed, incompatible],
      'user-separated'
    );
    expect(result).toContain('Active (user):');
    expect(result).toContain('Active (built-in):');
    expect(result).toContain('Failed:');
    expect(result).toContain('Incompatible:');
  });

  it('handles all-labeled mode with built-in failed plugin', () => {
    const result = formatPluginStatus([builtInFailed], 'all-labeled');
    expect(result).toContain('Failed:');
    expect(result).toContain('✗ @opencode/legacy (oom) (built-in)');
  });

  it('handles all-labeled mode with built-in incompatible plugin', () => {
    const builtInIncompatible: PluginStatus = {
      name: '@opencode/legacy-builtin',
      status: 'incompatible',
      source: 'built-in',
    };
    const result = formatPluginStatus([builtInIncompatible], 'all-labeled');
    expect(result).toContain('Incompatible:');
    expect(result).toContain('⚠ @opencode/legacy-builtin (built-in)');
  });
});
