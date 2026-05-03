import { describe, it, expect, vi } from 'vitest';

const mockFs = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    existsSync: fn(),
    readFileSync: fn(),
    readdirSync: fn(),
    writeFileSync: fn(),
    mkdirSync: fn(),
    unlinkSync: fn(),
    statSync: fn(),
    appendFileSync: fn(),
  };
});
vi.mock('fs', () => ({ default: mockFs }));

import {
  mapClaudeHookToOpenCode,
  loadClaudeSettings,
} from '.opencode/plugins/config/claude-settings';

describe('mapClaudeHookToOpenCode', () => {
  it('maps PreToolUse to tool.execute.before', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      matcher: { app: 'bash' } as unknown as string,
      hooks: [{ command: 'scripts/pre-hook.sh' }],
    });
    expect(result.openCodeEvent).toBe('tool.execute.before');
    expect(result.unsupported).toHaveLength(0);
    expect(result.scripts).toHaveLength(1);
    expect(result.scripts[0].source).toBe('claude');
    expect(result.scripts[0].path).toBe('scripts/pre-hook.sh');
    expect(result.scripts[0].matcher).toEqual({ app: 'bash' });
  });

  it('maps PostToolUse to tool.execute.after', () => {
    const result = mapClaudeHookToOpenCode('PostToolUse', {
      hooks: [{ command: 'post-hook.sh' }],
    });
    expect(result.openCodeEvent).toBe('tool.execute.after');
  });

  it('maps PostToolUseFailure to tool.execute.after', () => {
    const result = mapClaudeHookToOpenCode('PostToolUseFailure', {
      hooks: [{ command: 'fail-hook.sh' }],
    });
    expect(result.openCodeEvent).toBe('tool.execute.after');
  });

  it('maps Stop to session.idle', () => {
    const result = mapClaudeHookToOpenCode('Stop', {
      hooks: [{ command: 'stop-hook.sh' }],
    });
    expect(result.openCodeEvent).toBe('session.idle');
  });

  it('maps SubagentStop to tool.execute.after.subagent', () => {
    const result = mapClaudeHookToOpenCode('SubagentStop', {
      hooks: [{ command: 'sub.sh' }],
    });
    expect(result.openCodeEvent).toBe('tool.execute.after.subagent');
  });

  it('maps SessionStart to session.created', () => {
    const result = mapClaudeHookToOpenCode('SessionStart', {
      hooks: [{ command: 'start.sh' }],
    });
    expect(result.openCodeEvent).toBe('session.created');
  });

  it('maps SessionEnd to session.deleted', () => {
    const result = mapClaudeHookToOpenCode('SessionEnd', {
      hooks: [{ command: 'end.sh' }],
    });
    expect(result.openCodeEvent).toBe('session.deleted');
  });

  it('maps UserPromptSubmit to chat.message', () => {
    const result = mapClaudeHookToOpenCode('UserPromptSubmit', {
      hooks: [{ command: 'msg.sh' }],
    });
    expect(result.openCodeEvent).toBe('chat.message');
  });

  it('maps PermissionRequest to permission.asked', () => {
    const result = mapClaudeHookToOpenCode('PermissionRequest', {
      hooks: [{ command: 'perm.sh' }],
    });
    expect(result.openCodeEvent).toBe('permission.asked');
  });

  it('maps PreCompact to experimental.session.compacting', () => {
    const result = mapClaudeHookToOpenCode('PreCompact', {
      hooks: [{ command: 'compact.sh' }],
    });
    expect(result.openCodeEvent).toBe('experimental.session.compacting');
  });

  it('maps FileChanged to file.watcher.updated', () => {
    const result = mapClaudeHookToOpenCode('FileChanged', {
      hooks: [{ command: 'watch.sh' }],
    });
    expect(result.openCodeEvent).toBe('file.watcher.updated');
  });

  it('marks Notification as unsupported', () => {
    const result = mapClaudeHookToOpenCode('Notification', {
      hooks: [{ command: 'notif.sh' }],
    });
    expect(result.openCodeEvent).toBe('');
    expect(result.unsupported).toContain('Notification');
  });

  it('marks ConfigChange as unsupported', () => {
    const result = mapClaudeHookToOpenCode('ConfigChange', {
      hooks: [{ command: 'cfg.sh' }],
    });
    expect(result.openCodeEvent).toBe('');
    expect(result.unsupported).toContain('ConfigChange');
  });

  it('marks CwdChanged as unsupported', () => {
    const result = mapClaudeHookToOpenCode('CwdChanged', {
      hooks: [{ command: 'cwd.sh' }],
    });
    expect(result.openCodeEvent).toBe('');
    expect(result.unsupported).toContain('CwdChanged');
  });

  it('marks unknown events as unsupported', () => {
    const result = mapClaudeHookToOpenCode('UnknownEvent', {
      hooks: [{ command: 'unk.sh' }],
    });
    expect(result.openCodeEvent).toBe('');
    expect(result.unsupported).toContain('UnknownEvent');
  });

  it('extracts command path by stripping node prefix', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      matcher: { app: 'bash' } as unknown as string,
      hooks: [{ command: 'node scripts/hook.js' }],
    });
    expect(result.scripts[0].path).toBe('scripts/hook.js');
  });

  it('extracts command path by stripping bash prefix', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      hooks: [{ command: 'bash scripts/hook.sh' }],
    });
    expect(result.scripts[0].path).toBe('scripts/hook.sh');
  });

  it('preserves async and timeout from hook config', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      matcher: { app: 'bash' } as unknown as string,
      hooks: [{ command: 'sleep.sh', async: true, timeout: 30000 }],
    });
    expect(result.scripts[0].async).toBe(true);
    expect(result.scripts[0].timeout).toBe(30000);
  });
});

describe('loadClaudeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty hooks when disableAllHooks is true', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue(
      JSON.stringify({ disableAllHooks: true, hooks: { PreToolUse: [] } })
    );

    const result = loadClaudeSettings('/test/project');
    expect(result.hooks).toEqual({});
    expect(result.unsupported).toEqual([]);
  });

  it('returns empty hooks when hooks is missing', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue(JSON.stringify({}));

    const result = loadClaudeSettings('/test/project');
    expect(result.hooks).toEqual({});
    expect(result.unsupported).toEqual([]);
  });

  it('returns empty hooks when hooks is empty', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue(
      JSON.stringify({ hooks: {} })
    );

    const result = loadClaudeSettings('/test/project');
    expect(result.hooks).toEqual({});
  });

  it('merges hierarchy: user → project → local override', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync)
      .mockReturnValueOnce(
        JSON.stringify({
          hooks: {
            PreToolUse: [
              { matcher: { app: 'bash' }, hooks: [{ command: 'base.sh' }] },
            ],
          },
        })
      )
      .mockReturnValueOnce(
        JSON.stringify({
          hooks: {
            PreToolUse: [
              { matcher: { app: 'bash' }, hooks: [{ command: 'override.sh' }] },
            ],
          },
        })
      )
      .mockReturnValueOnce(
        JSON.stringify({
          hooks: { PostToolUse: [{ hooks: [{ command: 'local.sh' }] }] },
        })
      );

    const result = loadClaudeSettings('/test/project');
    expect(result.hooks['tool.execute.before']).toHaveLength(1);
    expect(result.hooks['tool.execute.before'][0].path).toBe('override.sh');
    expect(result.hooks['tool.execute.after']).toHaveLength(1);
  });

  it('skips files that do not exist', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(false);

    const result = loadClaudeSettings('/test/project');
    expect(result.hooks).toEqual({});
    expect(result.unsupported).toEqual([]);
  });

  it('collects unsupported events', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue(
      JSON.stringify({
        hooks: { Notification: [{ hooks: [{ command: 'notif.sh' }] }] },
      })
    );

    const result = loadClaudeSettings('/test/project');
    expect(result.unsupported).toContain('Notification');
  });

  it('parses hooks with valid matcher', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue(
      JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: { app: 'bash' },
              hooks: [
                { command: 'scripts/pre-hook.sh', async: true, timeout: 10000 },
              ],
            },
          ],
        },
      })
    );

    const result = loadClaudeSettings('/test/project');
    expect(result.hooks['tool.execute.before']).toHaveLength(1);
    expect(result.hooks['tool.execute.before'][0].matcher).toEqual({
      app: 'bash',
    });
    expect(result.hooks['tool.execute.before'][0].async).toBe(true);
    expect(result.hooks['tool.execute.before'][0].timeout).toBe(10000);
  });
});
