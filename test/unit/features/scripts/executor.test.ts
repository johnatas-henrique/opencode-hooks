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

  it('returns allow when stdout is empty', () => {
    const result = parseHookOutput('', '', 0);
    expect(result.action).toBe('allow');
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
  it('uses empty object when input has no args', () => {
    const result = buildClaudeStdin('tool.execute.before', 'Bash', {
      sessionID: 'sess-1',
    });
    expect(result.tool_input).toEqual({});
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

  it('returns invalid path error for backslash', async () => {
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');

    const result = await executeScript(
      { source: 'native', path: 'script\\test.sh' },
      'session.created',
      '',
      { sessionID: 'sess-1' }
    );

    expect(result.output).toContain('Invalid script path');
  });

  it('returns invalid path for empty string path', async () => {
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');

    const result = await executeScript(
      { source: 'native', path: '' },
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

  it('handles non-zero exit code with stderr', async () => {
    const { spawn } = await import('child_process');
    const { executeScript } =
      await import('.opencode/plugins/features/scripts/executor');
    const mockSpawn = vi.mocked(spawn);

    const mockStderr = {
      on: vi.fn((event, cb) => {
        if (event === 'data') cb(Buffer.from('Script error output'));
      }),
    };

    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: mockStderr,
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') cb(5);
      }),
    };
    mockSpawn.mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);

    const result = await executeScript(
      { source: 'native', path: 'error.sh' },
      'tool.execute.before',
      'Bash',
      { sessionID: 'sess-1', args: {} }
    );

    expect(result.exitCode).toBe(5);
    expect(result.output).toContain('Exit code 5');
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
  it('uses empty object when args is not provided', () => {
    const result = buildOpencodeStdin('tool.execute.before', 'Bash', {
      sessionID: 'sess-1',
    });
    expect(result.tool_input).toEqual({});
  });

  it('includes tool_result when output is provided', () => {
    const output = { result: 'tool result data' };
    const result = buildOpencodeStdin(
      'tool.execute.after',
      'Bash',
      {
        sessionID: 'sess-1',
        args: { command: 'ls' },
      },
      output
    );
    expect(result.tool_result).toEqual(output);
  });

  it('includes tool_name and tool_input when toolName is provided', () => {
    const result = buildOpencodeStdin('tool.execute.before', 'Bash', {
      sessionID: 'sess-1',
      args: { command: 'ls -la' },
    });
    expect(result.tool_name).toBe('Bash');
    expect(result.tool_input).toEqual({ command: 'ls -la' });
  });

  it('uses event type when toolName is empty string', () => {
    const result = buildOpencodeStdin('session.created', '', {
      sessionID: 'sess-1',
    });
    expect(result.event_type).toBe('session.created');
    expect(result.tool_name).toBeUndefined();
  });
});
