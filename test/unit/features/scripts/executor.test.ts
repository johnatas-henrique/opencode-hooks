import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fromAny } from '@total-typescript/shoehorn';
import { createSyncMockFs } from '../../../helpers/mock-fs';
import { createSpawnMock } from '../../../helpers/mock-child-process';

vi.mock('fs', () => ({ default: createSyncMockFs() }));
vi.mock('child_process', () => createSpawnMock());

import {
  sanitizeArg,
  validateScriptPath,
  resolveScriptPath,
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

async function runExecuteScript(
  entry: Partial<ScriptEntry> = {},
  options: {
    eventType?: string;
    toolName?: string;
    context?: Record<string, unknown>;
    mockOverrides?: Record<string, unknown>;
    closeCode?: number | null;
  } = {}
) {
  const {
    eventType = 'tool.execute.before',
    toolName = 'bash',
    context = { sessionID: 's1' },
    mockOverrides = {},
    closeCode = 0,
  } = options;

  const mockProc = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    stdin: { write: vi.fn(), end: vi.fn() },
    on: vi.fn(),
    unref: vi.fn(),
    ...mockOverrides,
  };
  vi.mocked(spawn).mockReturnValue(
    fromAny<ChildProcess, Record<string, unknown>>(mockProc)
  );

  const fullEntry: ScriptEntry = {
    source: 'native',
    path: 'test.sh',
    ...entry,
  };
  const promise = executeScript(fullEntry, eventType, toolName, context);

  const closeHandler = mockProc.on.mock.calls.find(
    (c: unknown[]) => c[0] === 'close'
  );
  if (closeHandler) {
    (closeHandler[1] as (code: number | null) => void)(closeCode);
  }

  return { result: await promise, mockProc };
}

function runExecute(entry: Partial<ScriptEntry> = {}) {
  return executeScript(
    { source: 'native', path: 'test.sh', ...entry },
    'session.created',
    '',
    { sessionID: 's1' }
  );
}

async function runWithStdout(stdoutData: string) {
  vi.mocked(spawn).mockReturnValueOnce(
    makeMockChildProcess({
      stdout: {
        on: vi.fn((event: string, cb: (d: Buffer) => void) => {
          if (event === 'data') cb(Buffer.from(stdoutData));
        }),
      },
    })
  );
  return await runExecute();
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

  it('allows absolute unix paths (from .claude/settings.json)', () => {
    expect(validateScriptPath('/etc/passwd')).toBe(true);
  });

  it('allows tilde paths (from .claude/settings.json)', () => {
    expect(validateScriptPath('~/script.sh')).toBe(true);
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

  it('uses default reason when both stderr and stdout are empty at exit code 2', () => {
    const result = parseHookOutput('', '', 2);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Blocked by exit code 2');
  });

  it('handles hookSpecificOutput with deny without reason', () => {
    const result = parseHookOutput(
      JSON.stringify({
        hookSpecificOutput: { permissionDecision: 'deny' },
      }),
      '',
      0
    );
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Denied');
  });

  it('uses default reason for decision block without reason', () => {
    const result = parseHookOutput(
      JSON.stringify({ decision: 'block' }),
      '',
      0
    );
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Blocked');
  });

  it('uses default reason for continue false without stopReason', () => {
    const result = parseHookOutput(JSON.stringify({ continue: false }), '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Stopped');
  });

  it('uses default reason for ok false without reason', () => {
    const result = parseHookOutput(JSON.stringify({ ok: false }), '', 0);
    expect(result.action).toBe('error');
    expect(result.reason).toBe('Failed');
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
    expect(result.tool_name).toBe('Bash');
  });

  it('maps event types to claude names', () => {
    const result = buildClaudeStdin('session.created', '', { sessionID: 's1' });
    expect(result.hook_event_name).toBe('SessionStart');
  });

  it('passes through unknown event types', () => {
    const result = buildClaudeStdin('custom.event', '', { sessionID: 's1' });
    expect(result.hook_event_name).toBe('custom.event');
  });

  it('includes agent_type for SubagentStop', () => {
    const result = buildClaudeStdin('tool.execute.after.subagent', '', {
      sessionID: 's1',
      subagentType: 'explore',
    });
    expect(result.agent_type).toBe('explore');
  });

  it('includes agent_type and description for SubagentStart', () => {
    const result = buildClaudeStdin('tool.execute.before.subagent', '', {
      sessionID: 's1',
      subagentType: 'game-designer',
      description: 'Design the combat healing mechanic',
    });
    expect(result.hook_event_name).toBe('SubagentStart');
    expect(result.agent_type).toBe('game-designer');
    expect(result.description).toBe('Design the combat healing mechanic');
  });

  it('includes file_path for FileChanged', () => {
    const result = buildClaudeStdin('file.watcher.updated', '', {
      sessionID: 's1',
      file: '/tmp/test.ts',
    });
    expect(result.file_path).toBe('/tmp/test.ts');
  });

  it('handles subagentStop output with non-object model gracefully', () => {
    const result = buildClaudeStdin(
      'tool.execute.after.subagent',
      '',
      { sessionID: 's1', callID: 'call_2' },
      {
        metadata: {
          model: 'string-not-object',
          sessionId: 'ses_2',
        },
      }
    );
    expect(result.model).toBeUndefined();
    expect(result.agent_transcript_path).toBe('ses_2');
  });

  it('handles subagentStop output with object model but non-string modelID', () => {
    const result = buildClaudeStdin(
      'tool.execute.after.subagent',
      '',
      { sessionID: 's1', callID: 'call_3' },
      {
        metadata: {
          model: { notModelID: 'something' },
          sessionId: 'ses_3',
        },
      }
    );
    expect(result.model).toBeUndefined();
    expect(result.agent_transcript_path).toBe('ses_3');
  });

  it('falls back to empty description when SubagentStart has no description', () => {
    const result = buildClaudeStdin('tool.execute.before.subagent', '', {
      sessionID: 's1',
      subagentType: 'explore',
    });
    expect(result.description).toBe('');
  });

  it('extracts description from args for SubagentStop', () => {
    const result = buildClaudeStdin('tool.execute.after.subagent', '', {
      sessionID: 's1',
      callID: 'call_6',
      args: { description: 'From args' },
    });
    expect(result.description).toBe('From args');
  });

  it('handles non-string sessionId metadata for SubagentStop', () => {
    const result = buildClaudeStdin(
      'tool.execute.after.subagent',
      '',
      { sessionID: 's1', callID: 'call_7' },
      {
        metadata: {
          model: { modelID: 'claude-3' },
          sessionId: 123,
        },
      }
    );
    expect(result.model).toBe('claude-3');
    expect(result.agent_transcript_path).toBeUndefined();
  });

  it('falls back to empty file_path for FileChanged without file', () => {
    const result = buildClaudeStdin('file.watcher.updated', '', {
      sessionID: 's1',
    });
    expect(result.file_path).toBe('');
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

  it('includes agent_type for tool.execute.after.subagent', () => {
    const result = buildOpencodeStdin('tool.execute.after.subagent', '', {
      sessionID: 's1',
      subagentType: 'explore',
    });
    expect(result.agent_type).toBe('explore');
  });

  it('includes agent_type and description for tool.execute.before.subagent', () => {
    const result = buildOpencodeStdin('tool.execute.before.subagent', '', {
      sessionID: 's1',
      subagentType: 'game-designer',
      description: 'Design the combat healing mechanic',
    });
    expect(result.event_type).toBe('tool.execute.before.subagent');
    expect(result.agent_type).toBe('game-designer');
    expect(result.description).toBe('Design the combat healing mechanic');
  });

  it('falls back to empty description when missing for tool.execute.before.subagent', () => {
    const result = buildOpencodeStdin('tool.execute.before.subagent', '', {
      sessionID: 's1',
      subagentType: 'explore',
    });
    expect(result.description).toBe('');
  });

  it('includes file_path for file.watcher.updated', () => {
    const result = buildOpencodeStdin('file.watcher.updated', '', {
      sessionID: 's1',
      file: 'src/main.ts',
    });
    expect(result.file_path).toBe('src/main.ts');
  });

  it('extracts model from metadata for tool.execute.after.subagent', () => {
    const result = buildOpencodeStdin(
      'tool.execute.after.subagent',
      '',
      { sessionID: 's1', callID: 'call_1', subagentType: 'explore' },
      {
        metadata: {
          model: { modelID: 'claude-3-opus' },
          sessionId: 'ses_sub',
        },
      }
    );
    expect(result.agent_id).toBe('call_1');
    expect(result.model).toBe('claude-3-opus');
    expect(result.agent_transcript_path).toBe('ses_sub');
  });

  it('handles subagentStop output with non-object model in opencode stdin', () => {
    const result = buildOpencodeStdin(
      'tool.execute.after.subagent',
      '',
      { sessionID: 's1', callID: 'call_2' },
      {
        metadata: {
          model: 'plain-string',
          sessionId: null,
        },
      }
    );
    expect(result.model).toBeUndefined();
    expect(result.agent_transcript_path).toBeUndefined();
  });

  it('extracts description from args for tool.execute.after.subagent', () => {
    const result = buildOpencodeStdin('tool.execute.after.subagent', '', {
      sessionID: 's1',
      callID: 'call_4',
      args: { description: 'Test subagent' },
    });
    expect(result.description).toBe('Test subagent');
  });

  it('handles object model with non-string modelID in opencode stdin', () => {
    const result = buildOpencodeStdin(
      'tool.execute.after.subagent',
      '',
      { sessionID: 's1', callID: 'call_5' },
      {
        metadata: {
          model: { notModelID: 123 },
          sessionId: 'ses_5',
        },
      }
    );
    expect(result.model).toBeUndefined();
    expect(result.agent_transcript_path).toBe('ses_5');
  });

  it('falls back to empty file_path when file is missing for file.watcher.updated', () => {
    const result = buildOpencodeStdin('file.watcher.updated', '', {
      sessionID: 's1',
    });
    expect(result.file_path).toBe('');
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
    const { result } = await runExecuteScript({ path: 'valid.sh' });
    expect(result.script).toBe('valid.sh');
  });

  it('resolves with block output when exit code is 2', async () => {
    const { result } = await runExecuteScript(
      { path: 'block.sh' },
      {
        closeCode: 2,
        mockOverrides: {
          stderr: {
            on: vi.fn(function (event: string, cb: (d: Buffer) => void) {
              if (event === 'data') cb(Buffer.from('Denied'));
            }),
          },
        },
      }
    );
    expect(result.exitCode).toBe(2);
  });

  it('skips stdin building when passStdin is false', async () => {
    const { result, mockProc } = await runExecuteScript(
      { passStdin: false },
      { toolName: '' }
    );
    expect(result.script).toBe('test.sh');
    expect(mockProc.stdin.write).not.toHaveBeenCalled();
  });

  it('spawns async script with explicit command when path has prefix', async () => {
    const entry: ScriptEntry = {
      source: 'native',
      path: 'node async_runner.js',
      async: true,
    };
    const result = await executeScript(entry, 'tool.execute.before', 'bash', {
      sessionID: 's1',
    });
    expect(result.exitCode).toBe(0);
    expect(spawn).toHaveBeenCalledWith(
      'node',
      [expect.stringContaining('async_runner.js')],
      expect.objectContaining({ stdio: 'ignore' })
    );
  });

  it('handles non-zero exit code', async () => {
    vi.mocked(spawn).mockReturnValueOnce(
      makeMockChildProcess({
        on: vi.fn((event: string, cb: (code: number | null) => void) => {
          if (event === 'close') cb(1);
        }),
      })
    );

    const result = await runExecute();
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

    const result = await runExecute();
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
    const result = await runWithStdout(stdoutData);
    expect(result.exitCode).toBe(2);
    expect(result.output).toBe('not allowed');
  });

  it('parses JSON stdout with decision block', async () => {
    const stdoutData = JSON.stringify({
      decision: 'block',
      reason: 'blocked by policy',
    });
    const result = await runWithStdout(stdoutData);
    expect(result.exitCode).toBe(2);
    expect(result.output).toContain('blocked by policy');
  });

  it('parses JSON stdout with continue false', async () => {
    const stdoutData = JSON.stringify({
      continue: false,
      stopReason: 'user requested stop',
    });
    const result = await runWithStdout(stdoutData);
    expect(result.exitCode).toBe(2);
    expect(result.output).toContain('user requested stop');
  });

  it('parses JSON stdout with ok false', async () => {
    const stdoutData = JSON.stringify({ ok: false, reason: 'failed' });
    const result = await runWithStdout(stdoutData);
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

    const result = await runExecute();
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('Spawn failed');
  });

  it('uses buildClaudeStdin for claude source scripts', async () => {
    const { mockProc } = await runExecuteScript(
      { source: 'claude', path: 'hooks.sh' },
      { context: { sessionID: 's1', callID: 'c1' } }
    );

    expect(spawn).toHaveBeenCalledWith(
      expect.stringContaining('hooks.sh'),
      [],
      expect.objectContaining({ stdio: ['pipe', 'pipe', 'pipe'] })
    );
    expect(mockProc.stdin.write).toHaveBeenCalled();
  });

  it('skips stdin for unknown source (neither claude nor native)', async () => {
    const { mockProc } = await runExecuteScript({
      source: 'unknown' as 'native',
      path: 'test.sh',
    });

    expect(mockProc.stdin.write).not.toHaveBeenCalled();
  });
});
