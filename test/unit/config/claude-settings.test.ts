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
});

describe('loadClaudeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
