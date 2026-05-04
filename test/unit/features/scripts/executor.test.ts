import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fromAny } from '@total-typescript/shoehorn';

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

const mockSpawn = vi.hoisted(() => {
  const procFn = () => vi.fn();
  return {
    spawn: vi.fn(() => ({
      stdout: { on: procFn() },
      stderr: { on: procFn() },
      stdin: { write: procFn(), end: procFn() },
      on: procFn(),
      unref: procFn(),
    })),
  };
});
vi.mock('child_process', () => mockSpawn);

import {
  sanitizeArg,
  validateScriptPath,
  resolveScriptPath,
  getStopHookStateFile,
  getStopHookActive,
  setStopHookState,
  clearStopHookState,
  parseHookOutput,
  buildClaudeStdin,
  buildOpencodeStdin,
  executeScript,
} from '.opencode/plugins/features/scripts/executor';
import type { ScriptEntry } from '.opencode/plugins/types/config';
import type { ChildProcess } from 'child_process';
import { spawn } from 'child_process';

function makeMockChildProcess(
  overrides: Record<string, unknown> = {}
): ChildProcess {
  return fromAny<ChildProcess, unknown>({
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    stdin: { write: vi.fn(), end: vi.fn() },
    on: vi.fn((event: string, cb: (code: number | null) => void) => {
      if (event === 'close') cb(0);
    }),
    unref: vi.fn(),
    ...overrides,
  });
}

describe('sanitizeArg', () => {
  it('replaces shell special chars with escaped versions', () => {
    expect(sanitizeArg('normal')).toBe('normal');
    expect(sanitizeArg('arg;')).toBe('arg\\;');
    expect(sanitizeArg('$HOME')).toBe('\\$HOME');
    expect(sanitizeArg('$(cmd)')).toBe('\\$\\(cmd\\)');
    expect(sanitizeArg('back`tick')).toBe('back\\`tick');
  });

  it('escapes newlines and quotes', () => {
    expect(sanitizeArg('it\'s "quoted"')).toBe('it\\\'s \\"quoted\\"');
  });
});

describe('validateScriptPath', () => {
  it('rejects empty string', () => {
    expect(validateScriptPath('')).toBe(false);
  });

  it('rejects path with ".."', () => {
    expect(validateScriptPath('../escape.sh')).toBe(false);
  });

  it('rejects absolute unix paths', () => {
    expect(validateScriptPath('/etc/passwd')).toBe(false);
  });

  it('rejects tilde paths', () => {
    expect(validateScriptPath('~/script.sh')).toBe(false);
  });

  it('rejects windows absolute paths', () => {
    expect(validateScriptPath('C:\\script.sh')).toBe(false);
  });

  it('rejects paths with backslash', () => {
    expect(validateScriptPath('sub\\dir\\script.sh')).toBe(false);
  });

  it('allows relative paths with subdirectories', () => {
    expect(validateScriptPath('subdir/script.sh')).toBe(true);
  });

  it('allows simple script names', () => {
    expect(validateScriptPath('test.sh')).toBe(true);
  });
});

describe('resolveScriptPath', () => {
  it('joins cwd with .opencode/scripts and the script path', () => {
    const originalCwd = process.cwd;
    process.cwd = vi.fn(() => '/home/project');
    const result = resolveScriptPath('test.sh');
    expect(result).toBe('/home/project/.opencode/scripts/test.sh');
    process.cwd = originalCwd;
  });
});

describe('getStopHookStateFile', () => {
  it('returns path with session id', () => {
    const result = getStopHookStateFile('ses_123');
    expect(result).toContain('ses_123_stop_flag');
  });
});

describe('getStopHookActive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when state file exists', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    expect(getStopHookActive('ses_1')).toBe(true);
  });

  it('returns false when state file does not exist', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(false);
    expect(getStopHookActive('ses_1')).toBe(false);
  });

  it('returns false when existsSync throws', () => {
    vi.mocked(mockFs.existsSync).mockImplementation(() => {
      throw new Error('permission');
    });
    expect(getStopHookActive('ses_1')).toBe(false);
  });
});

describe('setStopHookState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates directory and writes state file', () => {
    vi.mocked(mockFs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(mockFs.writeFileSync).mockReturnValue(undefined);

    setStopHookState('ses_1');
    expect(mockFs.mkdirSync).toHaveBeenCalled();
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('ses_1_stop_flag'),
      'true'
    );
  });

  it('silently handles errors', () => {
    vi.mocked(mockFs.mkdirSync).mockImplementation(() => {
      throw new Error('permission');
    });
    expect(() => setStopHookState('ses_1')).not.toThrow();
  });
});

describe('clearStopHookState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes state file when it exists', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.unlinkSync).mockReturnValue(undefined);

    clearStopHookState('ses_1');
    expect(mockFs.unlinkSync).toHaveBeenCalledWith(
      expect.stringContaining('ses_1_stop_flag')
    );
  });

  it('does not call unlink when file does not exist', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(false);

    clearStopHookState('ses_1');
    expect(mockFs.unlinkSync).not.toHaveBeenCalled();
  });
});

describe('parseHookOutput', () => {
  it('returns block action for exit code 2', () => {
    const result = parseHookOutput('', 'Denied by policy', 2);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Denied by policy');
  });

  it('returns error action for non-zero exit code', () => {
    const result = parseHookOutput('', 'Something broke', 1);
    expect(result.action).toBe('error');
    expect(result.reason).toContain('Something broke');
  });

  it('returns allow for valid JSON stdout with allow decision', () => {
    const result = parseHookOutput(
      JSON.stringify({ decision: 'allow' }),
      '',
      0
    );
    expect(result.action).toBe('allow');
  });

  it('returns block when JSON has decision "block"', () => {
    const result = parseHookOutput(
      JSON.stringify({ decision: 'block', reason: 'nope' }),
      '',
      0
    );
    expect(result.action).toBe('block');
    expect(result.reason).toBe('nope');
  });

  it('returns block when JSON has continue false', () => {
    const result = parseHookOutput(
      JSON.stringify({ continue: false, stopReason: 'stopped' }),
      '',
      0
    );
    expect(result.action).toBe('block');
    expect(result.reason).toBe('stopped');
  });

  it('returns block when JSON has ok false', () => {
    const result = parseHookOutput(
      JSON.stringify({ ok: false, reason: 'fail' }),
      '',
      0
    );
    expect(result.action).toBe('error');
    expect(result.reason).toBe('fail');
  });

  it('handles hookSpecificOutput with deny', () => {
    const stdout = JSON.stringify({
      hookSpecificOutput: {
        permissionDecision: 'deny',
        permissionDecisionReason: 'not allowed',
        updatedInput: {},
      },
    });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('not allowed');
    expect(result.updatedInput).toEqual({});
  });

  it('returns allow for invalid JSON', () => {
    const result = parseHookOutput('not-json', '', 0);
    expect(result.action).toBe('allow');
  });

  it('includes additionalContext and systemMessage on allow', () => {
    const stdout = JSON.stringify({
      additionalContext: 'ctx',
      systemMessage: 'msg',
    });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('allow');
    expect(result.additionalContext).toBe('ctx');
    expect(result.systemMessage).toBe('msg');
  });
});

describe('buildClaudeStdin', () => {
  it('builds base structure', () => {
    const result = buildClaudeStdin('tool.execute.before', 'bash', {
      sessionID: 's1',
    });
    expect(result.hook_event_name).toBe('PreToolUse');
    expect(result.session_id).toBe('s1');
    expect(result.tool_name).toBe('bash');
  });

  it('maps event types to claude names', () => {
    const result = buildClaudeStdin('session.created', '', { sessionID: 's1' });
    expect(result.hook_event_name).toBe('SessionStart');
  });

  it('passes through unknown event types', () => {
    const result = buildClaudeStdin('custom.event', '', { sessionID: 's1' });
    expect(result.hook_event_name).toBe('custom.event');
  });

  it('includes stop_hook_active for Stop events', () => {
    const result = buildClaudeStdin('session.idle', '', {
      sessionID: 's1',
      stopHookActive: true,
    });
    expect(result.stop_hook_active).toBe(true);
  });

  it('includes agent_type for SubagentStop', () => {
    const result = buildClaudeStdin('tool.execute.after.subagent', '', {
      sessionID: 's1',
      subagentType: 'explore',
    });
    expect(result.agent_type).toBe('explore');
  });

  it('includes file_path for FileChanged', () => {
    const result = buildClaudeStdin('file.watcher.updated', '', {
      sessionID: 's1',
      file: '/tmp/test.ts',
    });
    expect(result.file_path).toBe('/tmp/test.ts');
  });
});

describe('buildOpencodeStdin', () => {
  it('builds base structure', () => {
    const result = buildOpencodeStdin('tool.execute.before', 'bash', {
      sessionID: 's1',
    });
    expect(result.event_type).toBe('tool.execute.before');
    expect(result.session_id).toBe('s1');
    expect(result.tool_name).toBe('bash');
  });

  it('includes tool_result when output provided', () => {
    const result = buildOpencodeStdin(
      'tool.execute.after',
      'bash',
      { sessionID: 's1' },
      { status: 'ok' }
    );
    expect(result.tool_result).toEqual({ status: 'ok' });
  });

  it('includes stop_hook_active for session.idle', () => {
    const result = buildOpencodeStdin('session.idle', '', {
      sessionID: 's1',
      stopHookActive: true,
    });
    expect(result.stop_hook_active).toBe(true);
  });

  it('includes agent_type for tool.execute.after.subagent', () => {
    const result = buildOpencodeStdin('tool.execute.after.subagent', '', {
      sessionID: 's1',
      subagentType: 'explore',
    });
    expect(result.agent_type).toBe('explore');
  });

  it('includes file_path for file.watcher.updated', () => {
    const result = buildOpencodeStdin('file.watcher.updated', '', {
      sessionID: 's1',
      file: 'src/main.ts',
    });
    expect(result.file_path).toBe('src/main.ts');
  });
});

describe('executeScript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error for invalid script path', async () => {
    const entry: ScriptEntry = { source: 'native', path: '../escape.sh' };
    const result = await executeScript(entry, 'tool.execute.before', 'bash', {
      sessionID: 's1',
    });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('Invalid script path');
  });

  it('returns immediately for async scripts', async () => {
    const entry: ScriptEntry = {
      source: 'native',
      path: 'async.sh',
      async: true,
    };
    const result = await executeScript(entry, 'tool.execute.before', 'bash', {
      sessionID: 's1',
    });
    expect(result.exitCode).toBe(0);
    expect(result.output).toBe('');
  });

  it('spawns a process for sync scripts', async () => {
    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn(),
      unref: vi.fn(),
    };
    vi.mocked(mockSpawn.spawn).mockReturnValue(mockProc);

    const entry: ScriptEntry = { source: 'native', path: 'valid.sh' };
    const promise = executeScript(entry, 'tool.execute.before', 'bash', {
      sessionID: 's1',
    });

    const closeHandler = mockProc.on.mock.calls.find(
      (c: unknown[]) => c[0] === 'close'
    );
    if (closeHandler) {
      (closeHandler[1] as (code: number) => void)(0);
    }

    const result = await promise;
    expect(result.script).toBe('valid.sh');
  });

  it('resolves with block output when exit code is 2', async () => {
    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: {
        on: vi.fn(function (event: string, cb: (d: Buffer) => void) {
          if (event === 'data') cb(Buffer.from('Denied'));
        }),
      },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn(),
      unref: vi.fn(),
    };
    vi.mocked(mockSpawn.spawn).mockReturnValue(mockProc);

    const entry: ScriptEntry = { source: 'native', path: 'block.sh' };
    const promise = executeScript(entry, 'tool.execute.before', 'bash', {
      sessionID: 's1',
    });

    const closeHandler = mockProc.on.mock.calls.find(
      (c: unknown[]) => c[0] === 'close'
    );
    if (closeHandler) {
      (closeHandler[1] as (code: number) => void)(2);
    }

    const result = await promise;
    expect(result.exitCode).toBe(2);
  });

  it('skips stdin building when passStdin is false', async () => {
    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn(),
      unref: vi.fn(),
    };
    vi.mocked(mockSpawn.spawn).mockReturnValue(mockProc);

    const entry: ScriptEntry = {
      source: 'native',
      path: 'test.sh',
      passStdin: false,
    };
    const promise = executeScript(entry, 'tool.execute.before', '', {
      sessionID: 's1',
    });

    const closeHandler = mockProc.on.mock.calls.find(
      (c: unknown[]) => c[0] === 'close'
    );
    if (closeHandler) {
      (closeHandler[1] as (code: number) => void)(0);
    }

    const result = await promise;
    expect(result.script).toBe('test.sh');
    expect(mockProc.stdin.write).not.toHaveBeenCalled();
  });

  it('handles non-zero exit code', async () => {
    vi.mocked(spawn).mockReturnValueOnce(
      makeMockChildProcess({
        on: vi.fn((event: string, cb: (code: number | null) => void) => {
          if (event === 'close') cb(1);
        }),
      })
    );

    const result = await executeScript(
      { source: 'native', path: 'test.sh' },
      'session.created',
      '',
      { sessionID: 's1' }
    );
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('Exit code 1');
  });

  it('handles null exit code (process terminated unexpectedly)', async () => {
    vi.mocked(spawn).mockReturnValueOnce(
      makeMockChildProcess({
        on: vi.fn((event: string, cb: (code: number | null) => void) => {
          if (event === 'close') cb(null);
        }),
      })
    );

    const result = await executeScript(
      { source: 'native', path: 'test.sh' },
      'session.created',
      '',
      { sessionID: 's1' }
    );
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('terminated unexpectedly');
  });

  it('parses JSON stdout with permissionDecision deny', async () => {
    const stdoutData = JSON.stringify({
      hookSpecificOutput: {
        permissionDecision: 'deny',
        permissionDecisionReason: 'not allowed',
      },
    });
    vi.mocked(spawn).mockReturnValueOnce(
      makeMockChildProcess({
        stdout: {
          on: vi.fn((event: string, cb: (d: Buffer) => void) => {
            if (event === 'data') cb(Buffer.from(stdoutData));
          }),
        },
        on: vi.fn((event: string, cb: (code: number | null) => void) => {
          if (event === 'close') cb(0);
        }),
      })
    );

    const result = await executeScript(
      { source: 'native', path: 'test.sh' },
      'session.created',
      '',
      { sessionID: 's1' }
    );
    expect(result.exitCode).toBe(2);
    expect(result.output).toBe('not allowed');
  });

  it('parses JSON stdout with decision block', async () => {
    const stdoutData = JSON.stringify({
      decision: 'block',
      reason: 'blocked by policy',
    });
    vi.mocked(spawn).mockReturnValueOnce(
      makeMockChildProcess({
        stdout: {
          on: vi.fn((event: string, cb: (d: Buffer) => void) => {
            if (event === 'data') cb(Buffer.from(stdoutData));
          }),
        },
      })
    );

    const result = await executeScript(
      { source: 'native', path: 'test.sh' },
      'session.created',
      '',
      { sessionID: 's1' }
    );
    expect(result.exitCode).toBe(2);
    expect(result.output).toContain('blocked by policy');
  });

  it('parses JSON stdout with continue false', async () => {
    const stdoutData = JSON.stringify({
      continue: false,
      stopReason: 'user requested stop',
    });
    vi.mocked(spawn).mockReturnValueOnce(
      makeMockChildProcess({
        stdout: {
          on: vi.fn((event: string, cb: (d: Buffer) => void) => {
            if (event === 'data') cb(Buffer.from(stdoutData));
          }),
        },
      })
    );

    const result = await executeScript(
      { source: 'native', path: 'test.sh' },
      'session.created',
      '',
      { sessionID: 's1' }
    );
    expect(result.exitCode).toBe(2);
    expect(result.output).toContain('user requested stop');
  });

  it('parses JSON stdout with ok false', async () => {
    const stdoutData = JSON.stringify({ ok: false, reason: 'failed' });
    vi.mocked(spawn).mockReturnValueOnce(
      makeMockChildProcess({
        stdout: {
          on: vi.fn((event: string, cb: (d: Buffer) => void) => {
            if (event === 'data') cb(Buffer.from(stdoutData));
          }),
        },
        on: vi.fn((event: string, cb: (code: number | null) => void) => {
          if (event === 'close') cb(0);
        }),
      })
    );

    const result = await executeScript(
      { source: 'native', path: 'test.sh' },
      'session.created',
      '',
      { sessionID: 's1' }
    );
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('failed');
  });

  it('handles spawn error event', async () => {
    vi.mocked(spawn).mockReturnValueOnce(
      makeMockChildProcess({
        on: vi.fn((event: string, cb: (err: Error) => void) => {
          if (event === 'error') cb(new Error('ENOENT'));
        }),
      })
    );

    const result = await executeScript(
      { source: 'native', path: 'test.sh' },
      'session.created',
      '',
      { sessionID: 's1' }
    );
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('Spawn failed');
  });

  it('uses buildClaudeStdin for claude source scripts', async () => {
    const mockProc = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn(),
      unref: vi.fn(),
    };
    vi.mocked(mockSpawn.spawn).mockReturnValue(mockProc);

    const entry = { source: 'claude' as const, path: 'hooks.sh' };
    const promise = executeScript(
      entry,
      'tool.execute.before',
      'bash',
      { sessionID: 's1', callID: 'c1' },
      {}
    );

    const closeHandler = mockProc.on.mock.calls.find(
      (c: unknown[]) => c[0] === 'close'
    );
    if (closeHandler) {
      (closeHandler[1] as (code: number) => void)(0);
    }

    await promise;

    expect(mockSpawn.spawn).toHaveBeenCalledWith(
      expect.stringContaining('hooks.sh'),
      [],
      expect.objectContaining({ stdio: ['pipe', 'pipe', 'pipe'] })
    );
    expect(mockProc.stdin.write).toHaveBeenCalled();
  });
});
