import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapClaudeHookToOpenCode,
  loadClaudeSettings,
} from '.opencode/plugins/config/claude-settings';
import fs from 'fs';

vi.mock('fs', () => {
  const mockFs = {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
  return { default: mockFs, ...mockFs };
});

vi.mock('os', () => {
  const mockOs = {
    homedir: () => '/home/user',
  };
  return { default: mockOs, ...mockOs };
});

describe('mapClaudeHookToOpenCode', () => {
  it.skip('maps PreToolUse to tool.execute.before', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      hooks: [{ command: 'node block.sh' }],
    });
    expect(result.openCodeEvent).toBe('tool.execute.before');
    expect(result.scripts).toHaveLength(1);
    expect(result.scripts[0].source).toBe('claude');
    expect(result.scripts[0].path).toBe('block.sh');
  });

  it('maps Stop to session.idle', () => {
    const result = mapClaudeHookToOpenCode('Stop', {
      hooks: [{ command: 'bash idle.sh' }],
    });
    expect(result.openCodeEvent).toBe('session.idle');
  });

  it('extracts command path correctly', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      hooks: [{ command: 'node scripts/hook.js' }],
    });
    expect(result.scripts[0].path).toBe('scripts/hook.js');
  });

  it.skip('passes matcher and async/timeout', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      matcher: 'Bash|Write',
      hooks: [{ command: 'block.sh', async: true, timeout: 5000 }],
    });
    expect(result.scripts[0].matcher).toBe('Bash|Write');
    expect(result.scripts[0].async).toBe(true);
    expect(result.scripts[0].timeout).toBe(5000);
  });

  it.skip('returns unsupported for unmapped events', () => {
    const result = mapClaudeHookToOpenCode('Notification', {
      hooks: [{ command: 'hook.sh' }],
    });
    expect(result.openCodeEvent).toBe('');
    expect(result.scripts).toHaveLength(0);
    expect(result.unsupported).toEqual(['Notification']);
  });

  it.skip('returns unsupported for ConfigChange', () => {
    const result = mapClaudeHookToOpenCode('ConfigChange', {
      hooks: [{ command: 'hook.sh' }],
    });
    expect(result.openCodeEvent).toBe('');
    expect(result.unsupported).toEqual(['ConfigChange']);
  });

  it.skip('returns unsupported for CwdChanged', () => {
    const result = mapClaudeHookToOpenCode('CwdChanged', {
      hooks: [{ command: 'hook.sh' }],
    });
    expect(result.openCodeEvent).toBe('');
    expect(result.unsupported).toEqual(['CwdChanged']);
  });

  it.skip('maps multiple hooks in a group', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      hooks: [{ command: 'block-env.sh' }, { command: 'block-git.sh' }],
    });
    expect(result.scripts).toHaveLength(2);
    expect(result.scripts[0].path).toBe('block-env.sh');
    expect(result.scripts[1].path).toBe('block-git.sh');
  });
});

describe('loadClaudeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('returns empty hooks when no settings files exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = loadClaudeSettings('/project');
    expect(result.hooks).toEqual({});
    expect(result.unsupported).toEqual([]);
  });

  it.skip('loads and merges settings from hierarchy', () => {
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (
        typeof path === 'string' &&
        path.includes('/project/.claude/settings.json')
      )
        return true;
      return false;
    });
    vi.mocked(fs.readFileSync).mockImplementation((path) => {
      if (
        typeof path === 'string' &&
        path.includes('/project/.claude/settings.json')
      ) {
        return JSON.stringify({
          hooks: {
            PreToolUse: [{ hooks: [{ command: 'block.sh' }] }],
          },
        });
      }
      return '{}';
    });

    const result = loadClaudeSettings('/project');
    expect(result.hooks['tool.execute.before']).toHaveLength(1);
    expect(result.hooks['tool.execute.before'][0].path).toBe('block.sh');
  });

  it.skip('returns empty hooks when disableAllHooks is true', () => {
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (
        typeof path === 'string' &&
        path.includes('/project/.claude/settings.json')
      )
        return true;
      return false;
    });
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ disableAllHooks: true })
    );

    const result = loadClaudeSettings('/project');
    expect(result.hooks).toEqual({});
  });

  it('collects unsupported events', () => {
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (
        typeof path === 'string' &&
        path.includes('/project/.claude/settings.json')
      )
        return true;
      return false;
    });
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        hooks: {
          Notification: [{ hooks: [{ command: 'nop.sh' }] }],
          PreToolUse: [{ hooks: [{ command: 'block.sh' }] }],
        },
      })
    );

    const result = loadClaudeSettings('/project');
    expect(result.unsupported).toContain('Notification');
    expect(result.hooks['tool.execute.before']).toHaveLength(1);
  });

  it('deep merges settings from multiple files', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((path) => {
      if (
        typeof path === 'string' &&
        path.includes('/home/user/.claude/settings.json')
      ) {
        return JSON.stringify({
          hooks: {
            PreToolUse: [{ hooks: [{ command: 'global.sh' }] }],
          },
          other: { nested: { value: 1 } },
        });
      }
      if (
        typeof path === 'string' &&
        path.includes('/project/.claude/settings.json')
      ) {
        return JSON.stringify({
          hooks: {
            Stop: [{ hooks: [{ command: 'stop.sh' }] }],
          },
          other: { nested: { otherValue: 2 } },
        });
      }
      return '{}';
    });

    const result = loadClaudeSettings('/project');
    expect(result.hooks['tool.execute.before']).toHaveLength(1);
    expect(result.hooks['tool.execute.before'][0].path).toBe('global.sh');
    expect(result.hooks['session.idle']).toHaveLength(1);
    expect(result.hooks['session.idle'][0].path).toBe('stop.sh');
  });

  it('returns empty when no hooks defined', () => {
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (
        typeof path === 'string' &&
        path.includes('/project/.claude/settings.json')
      )
        return true;
      return false;
    });
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ otherSetting: 'value' })
    );

    const result = loadClaudeSettings('/project');
    expect(result.hooks).toEqual({});
  });
});
