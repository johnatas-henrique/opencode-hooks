import {
  parseHookOutput,
  buildClaudeStdin,
  buildOpencodeStdin,
} from '.opencode/plugins/features/scripts/executor';

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

  it('returns block when permissionDecision is deny', () => {
    const stdout = JSON.stringify({
      hookSpecificOutput: {
        permissionDecision: 'deny',
        permissionDecisionReason: 'Denied',
        updatedInput: { safe: true },
      },
    });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Denied');
  });

  it('returns block with default reason when permissionDecisionReason is missing', () => {
    const stdout = JSON.stringify({
      hookSpecificOutput: {
        permissionDecision: 'deny',
      },
    });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
  });

  it('returns block with undefined reason when reason is missing', () => {
    const stdout = JSON.stringify({ decision: 'block' });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBeUndefined();
  });

  it('returns block with undefined stopReason when stopReason is missing', () => {
    const stdout = JSON.stringify({ continue: false });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBeUndefined();
  });

  it('returns block with undefined reason when ok is false but reason is missing', () => {
    const stdout = JSON.stringify({ ok: false });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBeUndefined();
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

  it('includes tool_input with args', () => {
    const result = buildClaudeStdin('tool.execute.before', 'Bash', {
      sessionID: 'sess-1',
      args: { command: 'ls' },
    });
    expect(result.tool_input).toEqual({ command: 'ls' });
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

  it('includes tool_result for after events', () => {
    const result = buildOpencodeStdin(
      'tool.execute.after',
      'Read',
      { sessionID: 's1', args: { path: '/tmp' } },
      { content: 'file contents' }
    );
    expect(result.tool_name).toBe('Read');
    expect(result.tool_result).toEqual({ content: 'file contents' });
  });
});
