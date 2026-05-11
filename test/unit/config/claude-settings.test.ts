import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSyncMockFs } from '../../helpers/mock-fs';

vi.mock('fs', () => ({ default: createSyncMockFs() }));

vi.mock('os', () => ({
  default: {
    homedir: vi.fn(() => '/test/home'),
  },
}));

import fs from 'fs';
import {
  mapClaudeHookToOpenCode,
  loadClaudeSettings,
  getClaudeParseErrors,
} from '.opencode/plugins/features/adapters/claude-settings';

describe('mapClaudeHookToOpenCode', () => {
  it('maps PreToolUse to tool.execute.before', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      matcher: 'bash',
      hooks: [{ command: 'scripts/pre-hook.sh' }],
    });
    expect(result.openCodeEvent).toBe('tool.execute.before');
    expect(result.scripts).toHaveLength(1);
    expect(result.scripts[0].source).toBe('claude');
    expect(result.scripts[0].path).toBe('scripts/pre-hook.sh');
    expect(result.scripts[0].matcher).toBe('bash');
  });

  it('maps unknown events as unsupported', () => {
    const result = mapClaudeHookToOpenCode('UnknownEvent', {
      hooks: [{ command: 'unk.sh' }],
    });
    expect(result.openCodeEvent).toBe('');
    expect(result.scripts).toHaveLength(1);
  });

  it('expands tilde in command path', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      hooks: [{ command: '~/scripts/myhook.sh' }],
    });
    expect(result.scripts[0].path).toBe('/test/home/scripts/myhook.sh');
  });
});

describe('loadClaudeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupClaudeSettingsMock(
    globalContent: Record<string, unknown>,
    localContent: Record<string, unknown>
  ) {
    const globalPath = '/test/home/.claude/settings.json';
    const localPath = '/test/project/.claude/settings.json';
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const s = p.toString();
      return s === globalPath || s === localPath;
    });
    vi.mocked(fs.readFileSync).mockImplementation((p) => {
      if (p.toString() === globalPath) return JSON.stringify(globalContent);
      return JSON.stringify(localContent);
    });
  }

  it('returns empty hooks when hooks is missing', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}));
    const result = loadClaudeSettings('/test/project', {
      loadGlobal: true,
      loadLocal: true,
    });
    expect(result).toEqual({});
  });

  it('merges global and local scripts with different matchers', () => {
    setupClaudeSettingsMock(
      {
        hooks: {
          PreToolUse: [
            { matcher: { app: 'bash' }, hooks: [{ command: 'first.sh' }] },
          ],
        },
      },
      {
        hooks: {
          PreToolUse: [
            { matcher: { app: 'write' }, hooks: [{ command: 'second.sh' }] },
          ],
        },
      }
    );

    const result = loadClaudeSettings('/test/project', {
      loadGlobal: true,
      loadLocal: true,
    });
    expect(result['tool.execute.before']).toHaveLength(2);
    expect(result['tool.execute.before'][0].path).toBe('first.sh');
    expect(result['tool.execute.before'][1].path).toBe('second.sh');
  });

  it('returns empty when no files exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const result = loadClaudeSettings('/test/project', {
      loadGlobal: true,
      loadLocal: true,
    });
    expect(result).toEqual({});
  });

  it('merges scripts from different events across global and local', () => {
    setupClaudeSettingsMock(
      { hooks: { PreToolUse: [{ hooks: [{ command: 'global-pre.sh' }] }] } },
      {
        hooks: { SessionStart: [{ hooks: [{ command: 'local-session.sh' }] }] },
      }
    );

    const result = loadClaudeSettings('/test/project', {
      loadGlobal: true,
      loadLocal: true,
    });
    expect(result['tool.execute.before']).toHaveLength(1);
    expect(result['tool.execute.before'][0].path).toBe('global-pre.sh');
    expect(result['session.created']).toHaveLength(1);
    expect(result['session.created'][0].path).toBe('local-session.sh');
  });

  it('skips known event with empty hooks array', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        hooks: {
          PreToolUse: [{ hooks: [] }],
        },
      })
    );
    const result = loadClaudeSettings('/test/project', {
      loadGlobal: true,
      loadLocal: true,
    });
    expect(result).toEqual({});
  });

  it('handles malformed JSON and reports via getClaudeParseErrors', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('{ invalid json }');
    const result = loadClaudeSettings('/test/project', {
      loadGlobal: true,
      loadLocal: true,
    });
    expect(result).toEqual({});
    const errors = getClaudeParseErrors();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Malformed JSON');
  });

  it('handles readFileSync throwing non-SyntaxError', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('ENOENT: no such file');
    });
    const result = loadClaudeSettings('/test/project', {
      loadGlobal: true,
      loadLocal: true,
    });
    expect(result).toEqual({});
    const errors = getClaudeParseErrors();
    const enoentError = errors.find((e) => e.includes('ENOENT'));
    expect(enoentError).toBeDefined();
    expect(enoentError).toContain('Malformed JSON');
  });
});
