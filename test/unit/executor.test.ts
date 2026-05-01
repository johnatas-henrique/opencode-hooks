import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseHookOutput,
  buildClaudeStdin,
  buildOpencodeStdin,
} from '.opencode/plugins/features/scripts/executor';

vi.mock('child_process', () => ({
  spawn: vi.fn(),
  execSync: vi.fn(),
}));

describe('parseHookOutput', () => {
  it('returns block when exit code is 2', () => {
    const result = parseHookOutput('', 'Blocked content', 2);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Blocked content');
  });

  it('uses stderr as reason for exit code 2', () => {
    const result = parseHookOutput('', '', 2);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Blocked by exit code 2');
  });

  it('returns error for non-zero exit code', () => {
    const result = parseHookOutput('', 'Error message', 1);
    expect(result.action).toBe('error');
    expect(result.reason).toBe('Exit code 1: Error message');
  });

  it('returns allow when stdout is not valid JSON', () => {
    const result = parseHookOutput('not json', '', 0);
    expect(result.action).toBe('allow');
  });

  it('returns allow when stdout is empty', () => {
    const result = parseHookOutput('', '', 0);
    expect(result.action).toBe('allow');
  });

  it('returns block when permissionDecision is deny', () => {
    const stdout = JSON.stringify({
      hookSpecificOutput: {
        permissionDecision: 'deny',
        permissionDecisionReason: 'Not allowed',
      },
    });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Not allowed');
  });

  it('includes updatedInput from permission deny', () => {
    const stdout = JSON.stringify({
      hookSpecificOutput: {
        permissionDecision: 'deny',
        permissionDecisionReason: 'Denied',
        updatedInput: { safe: true },
      },
    });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.updatedInput).toEqual({ safe: true });
  });

  it('returns block when decision is block', () => {
    const stdout = JSON.stringify({
      decision: 'block',
      reason: 'Block reason',
    });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Block reason');
  });

  it('returns block when continue is false', () => {
    const stdout = JSON.stringify({ continue: false, stopReason: 'Stopped' });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Stopped');
  });

  it('returns block when ok is false', () => {
    const stdout = JSON.stringify({ ok: false, reason: 'Failed' });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Failed');
  });

  it('returns allow with additional context', () => {
    const stdout = JSON.stringify({
      additionalContext: 'Extra info',
      systemMessage: 'System msg',
    });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('allow');
    expect(result.additionalContext).toBe('Extra info');
    expect(result.systemMessage).toBe('System msg');
  });

  it('returns allow with updatedInput from hookSpecificOutput', () => {
    const stdout = JSON.stringify({
      hookSpecificOutput: {
        updatedInput: { modified: true },
      },
    });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('allow');
    expect(result.updatedInput).toEqual({ modified: true });
  });
});

describe('buildClaudeStdin', () => {
  it('builds base with event name mapped', () => {
    const result = buildClaudeStdin('tool.execute.before', 'Bash', {
      sessionID: 'sess-1',
      args: { command: 'ls' },
    });
    expect(result.hook_event_name).toBe('PreToolUse');
    expect(result.session_id).toBe('sess-1');
    expect(result.cwd).toBe(process.cwd());
    expect(result.permission_mode).toBe('default');
  });

  it('includes tool info when toolName provided', () => {
    const result = buildClaudeStdin('tool.execute.before', 'Bash', {
      sessionID: 'sess-1',
      args: { command: 'ls' },
    });
    expect(result.tool_name).toBe('Bash');
    expect(result.tool_input).toEqual({ command: 'ls' });
  });

  it('uses empty object when input has no args', () => {
    const result = buildClaudeStdin('tool.execute.before', 'Bash', {
      sessionID: 'sess-1',
    });
    expect(result.tool_input).toEqual({});
  });

  it('omits tool info when toolName is empty', () => {
    const result = buildClaudeStdin('session.created', '', {
      sessionID: 'sess-1',
    });
    expect(result.tool_name).toBeUndefined();
    expect(result.tool_input).toBeUndefined();
  });

  it('maps known events to claude names', () => {
    const cases: Record<string, string> = {
      'tool.execute.before': 'PreToolUse',
      'tool.execute.after': 'PostToolUse',
      'tool.execute.after.subagent': 'SubagentStop',
      'session.created': 'SessionStart',
      'session.deleted': 'SessionEnd',
      'session.idle': 'Stop',
      'chat.message': 'UserPromptSubmit',
      'permission.asked': 'PermissionRequest',
      'experimental.session.compacting': 'PreCompact',
      'file.watcher.updated': 'FileChanged',
    };
    for (const [eventType, expected] of Object.entries(cases)) {
      const result = buildClaudeStdin(eventType, '', { sessionID: '' });
      expect(result.hook_event_name).toBe(expected);
    }
  });

  it('uses event type as fallback for unknown events', () => {
    const result = buildClaudeStdin('unknown.event', '', { sessionID: '' });
    expect(result.hook_event_name).toBe('unknown.event');
  });
});

describe('executeScript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles spawn error', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn(),
      unref: vi.fn(),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const resultPromise = executeScript(
      { source: 'claude', path: 'hook.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: { command: 'ls' } }
    );

    const errorHandler = mockProc.on.mock.calls.find(
      ([event]) => event === 'error'
    )?.[1];
    errorHandler(new Error('ENOENT'));

    const result = await resultPromise;
    expect(result.output).toBe('Spawn failed: ENOENT');
  });

  it('runs async script without waiting', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockProc = {
      unref: vi.fn(),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'claude', path: 'async-hook.sh', async: true },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: { command: 'ls' } }
    );

    expect(mockProc.unref).toHaveBeenCalled();
    expect(result.output).toBe('');
  });

  it('handles process close with stdout/stderr', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from('output'));
      }),
    };
    const mockStderr = {
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from('error'));
      }),
    };

    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn(),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const resultPromise = executeScript(
      { source: 'claude', path: 'hook.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: { command: 'ls' } }
    );

    const closeHandler = mockProc.on.mock.calls.find(
      ([event]) => event === 'close'
    )?.[1];
    closeHandler(0);

    const result = await resultPromise;
    expect(result.output).toBe('output');
  });

  it('passes event type as arg when toolName is empty', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    await executeScript(
      { source: 'native', path: 'native.sh' },
      'session.created',
      '',
      { sessionID: 'sess-1' }
    );

    expect(mockSpawn).toHaveBeenCalled();
    const callArgs = mockSpawn.mock.calls[0];
    expect(callArgs[1]).toEqual(['session.created']);
  });

  it('uses empty args for non-native scripts', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    await executeScript(
      { source: 'claude', path: 'hook.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: { command: 'ls' } }
    );

    expect(mockSpawn).toHaveBeenCalled();
    const callArgs = mockSpawn.mock.calls[0];
    expect(callArgs[1]).toEqual([]);
  });

  it('handles null exit code as error', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn(),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const resultPromise = executeScript(
      { source: 'claude', path: 'hook.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: { command: 'ls' } }
    );

    const closeHandler = mockProc.on.mock.calls.find(
      ([event]) => event === 'close'
    )?.[1];
    closeHandler(null as unknown as number);

    const result = await resultPromise;
    expect(result.output).toContain('Process terminated unexpectedly');
    expect(result.exitCode).toBe(1);
  });

  it('passes stdin for native scripts with passStdin enabled', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    await executeScript(
      { source: 'native', path: 'hook.sh', passStdin: true },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: { command: 'ls' } },
      { result: 'done' }
    );

    expect(mockProc.stdin.write).toHaveBeenCalled();
    const writeCall = mockProc.stdin.write.mock.calls[0][0] as string;
    const parsed = JSON.parse(writeCall);
    expect(parsed.event_type).toBe('tool.execute.before');
    expect(parsed.session_id).toBe('sess-1');
    expect(parsed.tool_name).toBe('Bash');
    expect(parsed.tool_input).toEqual({ command: 'ls' });
    expect(parsed.tool_result).toEqual({ result: 'done' });
  });

  it('does not pass stdin for native scripts without passStdin', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    await executeScript(
      { source: 'native', path: 'hook.sh', passStdin: false },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: { command: 'ls' } }
    );

    expect(mockProc.stdin.write).not.toHaveBeenCalled();
  });

  it('returns invalid path error for path with ..', async () => {
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');

    const result = await executeScript(
      { source: 'native', path: '../evil.sh' },
      'session.created',
      '',
      { sessionID: 'sess-1' }
    );

    expect(result.output).toContain('Invalid script path');
  });

  it('returns invalid path error for absolute path', async () => {
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');

    const result = await executeScript(
      { source: 'native', path: '/etc/passwd' },
      'session.created',
      '',
      { sessionID: 'sess-1' }
    );

    expect(result.output).toContain('Invalid script path');
  });

  it('returns invalid path error for home path', async () => {
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');

    const result = await executeScript(
      { source: 'native', path: '~/script.sh' },
      'session.created',
      '',
      { sessionID: 'sess-1' }
    );

    expect(result.output).toContain('Invalid script path');
  });

  it('returns invalid path error for windows absolute', async () => {
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');

    const result = await executeScript(
      { source: 'native', path: 'C:\\windows\\system32' },
      'session.created',
      '',
      { sessionID: 'sess-1' }
    );

    expect(result.output).toContain('Invalid script path');
  });

  it('handles exit code 2 with stderr', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStdout = {
      on: vi.fn(),
    };
    const mockStderr = {
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from('Blocked by security'));
      }),
    };

    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(2);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'block.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.output).toBe('Blocked by security');
  });

  it('handles exit code 2 without stderr', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(2);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'block.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.output).toBe('Blocked by exit code 2');
  });

  it('parses JSON with decision block', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === 'data')
          cb(Buffer.from('{"decision":"block","reason":"No way"}'));
      }),
    };
    const mockStderr = { on: vi.fn() };

    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'block.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.output).toBe('No way');
  });

  it('parses JSON with continue false', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === 'data')
          cb(Buffer.from('{"continue":false,"stopReason":"Stopped"}'));
      }),
    };
    const mockStderr = { on: vi.fn() };

    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'stop.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.output).toBe('Stopped');
  });

  it('parses JSON with ok false', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from('{"ok":false,"reason":"Failed"}'));
      }),
    };
    const mockStderr = { on: vi.fn() };

    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'fail.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.output).toBe('Failed');
  });

  it('passes tool name as arg for native scripts', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    await executeScript(
      { source: 'native', path: 'tool-hook.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1' }
    );

    expect(mockSpawn).toHaveBeenCalled();
    const callArgs = mockSpawn.mock.calls[0];
    expect(callArgs[1]).toEqual(['Bash']);
  });

  it('default passStdin is true for native scripts', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    await executeScript(
      { source: 'native', path: 'hook.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: { command: 'ls' } }
    );

    expect(mockProc.stdin.write).toHaveBeenCalled();
  });

  it('parses JSON with permission deny', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === 'data')
          cb(
            Buffer.from(
              '{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"Not allowed"}}'
            )
          );
      }),
    };
    const mockStderr = { on: vi.fn() };

    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'perm.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.output).toBe('Not allowed');
  });

  it('parses JSON with permission deny without reason', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === 'data')
          cb(
            Buffer.from('{"hookSpecificOutput":{"permissionDecision":"deny"}}')
          );
      }),
    };
    const mockStderr = { on: vi.fn() };

    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'perm.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.output).toBe('Denied');
  });

  it('resolves with stdout when JSON has no block conditions', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from('{"action":"allowed"}'));
      }),
    };
    const mockStderr = { on: vi.fn() };

    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'allow.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.output).toBe('{"action":"allowed"}');
  });

  it('parses JSON with decision block but empty reason', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from('{"decision":"block"}'));
      }),
    };
    const mockStderr = { on: vi.fn() };

    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'block.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.output).toBe('Blocked');
  });

  it('parses JSON with continue false but empty stopReason', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from('{"continue":false}'));
      }),
    };
    const mockStderr = { on: vi.fn() };

    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'stop.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.output).toBe('Stopped');
  });

  it('parses JSON with ok false but empty reason', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStdout = {
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from('{"ok":false}'));
      }),
    };
    const mockStderr = { on: vi.fn() };

    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(0);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'fail.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.output).toBe('Failed');
  });
});

describe('buildOpencodeStdin', () => {
  it('builds base with event type', () => {
    const result = buildOpencodeStdin('session.created', '', {
      sessionID: 'sess-123',
    });
    expect(result.event_type).toBe('session.created');
    expect(result.session_id).toBe('sess-123');
    expect(result.cwd).toBe(process.cwd());
  });

  it('includes tool_name and tool_input when toolName provided', () => {
    const result = buildOpencodeStdin(
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: { command: 'ls -la' } },
      {}
    );
    expect(result.tool_name).toBe('Bash');
    expect(result.tool_input).toEqual({ command: 'ls -la' });
  });

  it('includes tool_result when output provided', () => {
    const output = { success: true, result: 'output' };
    const result = buildOpencodeStdin(
      'tool.execute.after',
      'Bash',
      { sessionID: 'sess-1', args: {} },
      output
    );
    expect(result.tool_result).toEqual(output);
  });

  it('omits tool_result when output is undefined', () => {
    const result = buildOpencodeStdin(
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} },
      undefined
    );
    expect(result.tool_result).toBeUndefined();
  });

  it('omits tool_name when toolName is empty', () => {
    const result = buildOpencodeStdin('session.created', '', {
      sessionID: 'sess-1',
    });
    expect(result.tool_name).toBeUndefined();
    expect(result.tool_input).toBeUndefined();
  });

  it('uses empty object when args is not provided', () => {
    const result = buildOpencodeStdin('tool.execute.before', 'Bash', {
      sessionID: 'sess-1',
    });
    expect(result.tool_input).toEqual({});
  });
});
