import {
  parseHookOutput,
  buildClaudeStdin,
  buildOpencodeStdin,
} from '.opencode/plugins/features/scripts/executor';

describe('executor - parseHookOutput', () => {
  it('returns block when exit code is 2', () => {
    const result = parseHookOutput('', 'Blocked by exit code 2', 2);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('Blocked by exit code 2');
  });

  it('returns error when exit code is non-zero and not 2', () => {
    const result = parseHookOutput('', 'something went wrong', 1);
    expect(result.action).toBe('error');
    expect(result.reason).toContain('Exit code 1');
  });

  it('returns allow on parse error', () => {
    const result = parseHookOutput('not json', '', 0);
    expect(result.action).toBe('allow');
  });

  it('returns block when hookSpecificOutput.decision is deny', () => {
    const stdout = JSON.stringify({
      hookSpecificOutput: {
        permissionDecision: 'deny',
        permissionDecisionReason: 'not allowed',
      },
    });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('not allowed');
  });

  it('returns block when decision is block', () => {
    const stdout = JSON.stringify({ decision: 'block', reason: 'user denied' });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('user denied');
  });

  it('returns block when continue is false', () => {
    const stdout = JSON.stringify({ continue: false, stopReason: 'stopped' });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('block');
    expect(result.reason).toBe('stopped');
  });

  it('returns allow with updatedInput and additionalContext', () => {
    const stdout = JSON.stringify({
      hookSpecificOutput: { updatedInput: { key: 'val' } },
      additionalContext: 'extra context',
    });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('allow');
    expect(result.updatedInput).toEqual({ key: 'val' });
    expect(result.additionalContext).toBe('extra context');
  });

  it('returns allow with systemMessage', () => {
    const stdout = JSON.stringify({ systemMessage: 'sys msg' });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('allow');
    expect(result.systemMessage).toBe('sys msg');
  });

  it('falls back to output.additionalContext when hookSpecific not present', () => {
    const stdout = JSON.stringify({ additionalContext: 'fallback ctx' });
    const result = parseHookOutput(stdout, '', 0);
    expect(result.action).toBe('allow');
    expect(result.additionalContext).toBe('fallback ctx');
  });
});

describe('executor - buildClaudeStdin', () => {
  it('maps event types correctly', () => {
    const result = buildClaudeStdin('tool.execute.before', 'bash', {
      sessionID: 's1',
      args: { cmd: 'ls' },
      callID: 'c1',
    });
    expect(result.hook_event_name).toBe('PreToolUse');
    expect(result.tool_name).toBe('bash');
    expect(result.tool_input).toEqual({ cmd: 'ls' });
    expect(result.tool_use_id).toBe('c1');
  });

  it('maps session.created to SessionStart', () => {
    const result = buildClaudeStdin('session.created', '', {
      sessionID: 's1',
    });
    expect(result.hook_event_name).toBe('SessionStart');
  });

  it('maps session.deleted to SessionEnd', () => {
    const result = buildClaudeStdin('session.deleted', '', {
      sessionID: 's1',
    });
    expect(result.hook_event_name).toBe('SessionEnd');
  });

  it('maps session.idle to Stop with stop_hook_active', () => {
    const result = buildClaudeStdin('session.idle', '', {
      sessionID: 's1',
      stopHookActive: true,
    });
    expect(result.hook_event_name).toBe('Stop');
    expect(result.stop_hook_active).toBe(true);
  });

  it('maps tool.execute.after.subagent to SubagentStop with agent_type', () => {
    const result = buildClaudeStdin('tool.execute.after.subagent', '', {
      sessionID: 's1',
      subagentType: 'sub',
    });
    expect(result.hook_event_name).toBe('SubagentStop');
    expect(result.agent_type).toBe('sub');
  });

  it('maps file.watcher.updated with file_path', () => {
    const result = buildClaudeStdin('file.watcher.updated', '', {
      sessionID: 's1',
      file: '/path/to/file',
    });
    expect(result.hook_event_name).toBe('FileChanged');
    expect(result.file_path).toBe('/path/to/file');
  });

  it('uses event type as-is when no mapping exists', () => {
    const result = buildClaudeStdin('unknown.event', '', {
      sessionID: 's1',
    });
    expect(result.hook_event_name).toBe('unknown.event');
  });

  it('includes cwd and session_id', () => {
    const result = buildClaudeStdin('session.created', '', {
      sessionID: 's1',
    });
    expect(result.session_id).toBe('s1');
    expect(result.cwd).toBe(process.cwd());
  });
});

describe('executor - buildOpencodeStdin', () => {
  it('includes event_type and session_id', () => {
    const result = buildOpencodeStdin('tool.execute.before', 'bash', {
      sessionID: 's1',
    });
    expect(result.event_type).toBe('tool.execute.before');
    expect(result.session_id).toBe('s1');
  });

  it('includes tool info when toolName provided', () => {
    const result = buildOpencodeStdin('tool.execute.before', 'bash', {
      sessionID: 's1',
      args: { cmd: 'ls' },
      callID: 'c1',
    });
    expect(result.tool_name).toBe('bash');
    expect(result.tool_input).toEqual({ cmd: 'ls' });
    expect(result.call_id).toBe('c1');
  });

  it('includes output when provided', () => {
    const output = { result: 'ok' };
    const result = buildOpencodeStdin(
      'tool.execute.after',
      'bash',
      {
        sessionID: 's1',
      },
      output
    );
    expect(result.tool_result).toBe(output);
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
      subagentType: 'sub',
    });
    expect(result.agent_type).toBe('sub');
  });

  it('includes stop_hook_active for subagent events', () => {
    const result = buildOpencodeStdin('tool.execute.after.subagent', '', {
      sessionID: 's1',
      stopHookActive: true,
    });
    expect(result.stop_hook_active).toBe(true);
  });

  it('includes agent_type for subagent events', () => {
    const result = buildOpencodeStdin('tool.execute.after.subagent', '', {
      sessionID: 's1',
      subagentType: 'sub',
    });
    expect(result.agent_type).toBe('sub');
  });
});
