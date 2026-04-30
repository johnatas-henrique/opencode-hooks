import { spawn } from 'child_process';
import path from 'path';
import type { ScriptEntry } from '../../types/config';
import { DEFAULTS } from '../../core/constants';

export interface HookResult {
  action: 'allow' | 'block' | 'error';
  reason?: string;
  updatedInput?: Record<string, unknown>;
  additionalContext?: string;
  systemMessage?: string;
}

const EVENT_NAME_MAP: Record<string, string> = {
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

function resolveScriptPath(scriptPath: string): string {
  const scriptsDir = path.join(process.cwd(), DEFAULTS.scripts.dir);
  return path.join(scriptsDir, scriptPath);
}

export function parseHookOutput(
  stdout: string,
  stderr: string,
  exitCode: number
): HookResult {
  if (exitCode === 2) {
    return { action: 'block', reason: stderr || 'Blocked by exit code 2' };
  }

  if (exitCode !== 0) {
    return { action: 'error', reason: `Exit code ${exitCode}: ${stderr}` };
  }

  try {
    const output = JSON.parse(stdout.trim()) as Record<string, unknown>;

    const hookSpecific = output.hookSpecificOutput as
      | Record<string, unknown>
      | undefined;
    if (hookSpecific?.permissionDecision === 'deny') {
      return {
        action: 'block',
        reason: hookSpecific.permissionDecisionReason as string,
        updatedInput: hookSpecific.updatedInput as Record<string, unknown>,
      };
    }

    if (output.decision === 'block') {
      return {
        action: 'block',
        reason: output.reason as string,
      };
    }

    if (output.continue === false) {
      return {
        action: 'block',
        reason: output.stopReason as string,
      };
    }

    if (output.ok === false) {
      return {
        action: 'block',
        reason: output.reason as string,
      };
    }

    return {
      action: 'allow',
      updatedInput: hookSpecific?.updatedInput as Record<string, unknown>,
      additionalContext: (hookSpecific?.additionalContext ||
        output.additionalContext) as string,
      systemMessage: output.systemMessage as string,
    };
  } catch {
    return { action: 'allow' };
  }
}

export function buildClaudeStdin(
  eventType: string,
  toolName: string,
  input: Record<string, unknown>
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    hook_event_name: EVENT_NAME_MAP[eventType] || eventType,
    session_id: input.sessionID,
    cwd: process.cwd(),
    permission_mode: 'default',
  };

  if (toolName) {
    base.tool_name = toolName;
    base.tool_input = input.args || {};
  }

  return base;
}

export function buildOpencodeStdin(
  eventType: string,
  toolName: string,
  input: Record<string, unknown>,
  output?: Record<string, unknown>
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    event_type: eventType,
    session_id: input.sessionID,
    cwd: process.cwd(),
  };

  if (toolName) {
    base.tool_name = toolName;
    base.tool_input = input.args || {};
  }

  if (output) {
    base.tool_result = output;
  }

  return base;
}

export async function executeScript(
  scriptEntry: ScriptEntry,
  eventType: string,
  toolName: string,
  input: Record<string, unknown>,
  output?: Record<string, unknown>
): Promise<HookResult> {
  const scriptPath = resolveScriptPath(scriptEntry.path);

  if (scriptEntry.async) {
    spawn(scriptPath, [], {
      stdio: 'ignore',
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: process.cwd() },
    }).unref();
    return { action: 'allow' };
  }

  let stdin: string | undefined;
  if (scriptEntry.source === 'claude') {
    const stdinData = buildClaudeStdin(eventType, toolName, input);
    stdin = JSON.stringify(stdinData);
  } else if (scriptEntry.source === 'native' && scriptEntry.passStdin) {
    const stdinData = buildOpencodeStdin(eventType, toolName, input, output);
    stdin = JSON.stringify(stdinData);
  }

  const args = scriptEntry.source === 'native' ? [toolName || eventType] : [];

  return new Promise<HookResult>((resolve) => {
    const proc = spawn(scriptPath, args, {
      stdio: stdin ? ['pipe', 'pipe', 'pipe'] : ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: process.cwd() },
    });

    if (stdin) {
      proc.stdin!.write(stdin);
      proc.stdin!.end();
    }

    const outChunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    proc.stdout!.on('data', (d: Buffer) => outChunks.push(d));
    proc.stderr!.on('data', (d: Buffer) => errChunks.push(d));

    proc.on('close', (code) => {
      const stdout = Buffer.concat(outChunks).toString();
      const stderr = Buffer.concat(errChunks).toString();
      resolve(parseHookOutput(stdout, stderr, code ?? -1));
    });

    proc.on('error', (err) => {
      resolve({ action: 'error', reason: `Spawn failed: ${err.message}` });
    });
  });
}
