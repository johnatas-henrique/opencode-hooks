import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { ScriptEntry } from '.opencode/plugins/types/config';
import { DEFAULTS } from '.opencode/plugins/core/constants';
import type { HookResult } from '.opencode/plugins/types/scripts';

const shellSpecialChars = /[;&|`$(){}[\]<>\\!#*?"'\n\r]/g;

export const sanitizeArg = (arg: string): string => {
  return arg.replace(shellSpecialChars, '\\$&');
};

export const validateScriptPath = (scriptPath: string): boolean => {
  if (!scriptPath || typeof scriptPath !== 'string') return false;
  if (scriptPath.includes('..')) return false;
  if (/^[a-zA-Z]:\\/.test(scriptPath)) return false;
  if (scriptPath.includes('\\')) return false;
  return true;
};

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

export function resolveScriptPath(scriptPath: string): string {
  // Paths absolutos (do .claude/settings.json) → usar direto
  if (path.isAbsolute(scriptPath)) {
    return scriptPath;
  }
  // Paths relativos (scripts nativos em ./scripts/) → resolver normalmente
  const scriptsDir = path.join(process.cwd(), DEFAULTS.scripts.dir);
  return path.join(scriptsDir, scriptPath);
}

const STOP_HOOK_STATE_DIR = path.join(
  process.cwd(),
  'production',
  'hook-state'
);

export function getStopHookStateFile(sessionId: string): string {
  return path.join(STOP_HOOK_STATE_DIR, `${sessionId}_stop_flag`);
}

export function getStopHookActive(sessionId: string): boolean {
  const filePath = getStopHookStateFile(sessionId);
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

export function setStopHookState(sessionId: string): void {
  const filePath = getStopHookStateFile(sessionId);
  try {
    fs.mkdirSync(STOP_HOOK_STATE_DIR, { recursive: true });
    fs.writeFileSync(filePath, 'true');
  } catch {
    // silently ignore
  }
}

export function clearStopHookState(sessionId: string): void {
  const filePath = getStopHookStateFile(sessionId);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // silently ignore
  }
}

export function parseHookOutput(
  stdout: string,
  stderr: string,
  exitCode: number
): HookResult {
  if (exitCode === 2) {
    return {
      action: 'block',
      reason: stderr || stdout || 'Blocked by exit code 2',
    };
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
        reason: (hookSpecific.permissionDecisionReason as string) || 'Denied',
        updatedInput: hookSpecific.updatedInput as Record<string, unknown>,
      };
    }

    if (output.decision === 'block') {
      return {
        action: 'block',
        reason: (output.reason as string) || 'Blocked',
      };
    }

    if (output.continue === false) {
      return {
        action: 'block',
        reason: (output.stopReason as string) || 'Stopped',
      };
    }

    if (output.ok === false) {
      return {
        action: 'error',
        reason: (output.reason as string) || 'Failed',
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
  input: Record<string, unknown>,
  output?: Record<string, unknown>
): Record<string, unknown> {
  const claudeEventName = EVENT_NAME_MAP[eventType] || eventType;

  const base: Record<string, unknown> = {
    hook_event_name: claudeEventName,
    session_id: input.sessionID,
    transcript_path: '',
    cwd: process.cwd(),
    permission_mode: 'default',
  };

  if (toolName) {
    base.tool_name = toolName;
    base.tool_input = output?.args ?? input.args ?? {};
    base.tool_use_id = input.callID;
  }

  if (claudeEventName === 'Stop' || claudeEventName === 'SubagentStop') {
    base.stop_hook_active = input.stopHookActive === true;
  }

  if (claudeEventName === 'SubagentStop') {
    base.agent_type = input.subagentType;
  }

  if (claudeEventName === 'FileChanged') {
    base.file_path = input.file || '';
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
    base.tool_input = output?.args ?? input.args ?? {};
    base.call_id = input.callID;
  }

  if (output) {
    base.tool_result = output;
  }

  if (
    eventType === 'session.idle' ||
    eventType === 'tool.execute.after.subagent'
  ) {
    base.stop_hook_active = input.stopHookActive === true;
  }

  if (eventType === 'tool.execute.after.subagent') {
    base.agent_type = input.subagentType;
  }

  if (eventType === 'file.watcher.updated') {
    base.file_path = input.file || '';
  }

  return base;
}

export async function executeScript(
  scriptEntry: ScriptEntry,
  eventType: string,
  toolName: string,
  input: Record<string, unknown>,
  output?: Record<string, unknown>
): Promise<{ script: string; output: string; exitCode: number }> {
  if (!validateScriptPath(scriptEntry.path)) {
    return {
      script: scriptEntry.path,
      output: `Invalid script path: ${scriptEntry.path}`,
      exitCode: 1,
    };
  }

  const scriptPath = resolveScriptPath(scriptEntry.path);

  if (scriptEntry.async) {
    spawn(scriptPath, [], {
      stdio: 'ignore',
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: process.cwd() },
    }).unref();
    return { script: scriptEntry.path, output: '', exitCode: 0 };
  }

  let stdin: string | undefined;
  if (scriptEntry.source === 'claude') {
    const stdinData = buildClaudeStdin(eventType, toolName, input, output);
    stdin = JSON.stringify(stdinData);
  } else if (scriptEntry.source === 'native') {
    const passStdin = scriptEntry.passStdin !== false;
    if (passStdin) {
      const stdinData = buildOpencodeStdin(eventType, toolName, input, output);
      stdin = JSON.stringify(stdinData);
    }
  }

  return new Promise<{ script: string; output: string; exitCode: number }>(
    (resolve) => {
      const proc = spawn(scriptPath, [], {
        stdio: stdin ? ['pipe', 'pipe', 'pipe'] : ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, CLAUDE_PLUGIN_ROOT: process.cwd() },
      });

      if (stdin) {
        proc.stdin!.write(stdin);
        proc.stdin!.end();
      }

      const outChunks: Buffer[] = [];
      const errChunks: Buffer[] = [];

      proc.stdout!.on('data', (d: Buffer) => {
        outChunks.push(d);
      });
      proc.stderr!.on('data', (d: Buffer) => {
        errChunks.push(d);
      });

      proc.on('close', (code) => {
        const stdout = Buffer.concat(outChunks).toString();
        const stderr = Buffer.concat(errChunks).toString();

        if (code === null) {
          resolve({
            script: scriptEntry.path,
            output: 'Process terminated unexpectedly',
            exitCode: 1,
          });
          return;
        }

        const result = parseHookOutput(stdout, stderr, code);

        if (result.action === 'block') {
          resolve({
            script: scriptEntry.path,
            output: result.reason!,
            exitCode: 2,
          });
          return;
        }

        if (result.action === 'error') {
          resolve({
            script: scriptEntry.path,
            output: result.reason!,
            exitCode: code === 0 ? 1 : code,
          });
          return;
        }

        resolve({ script: scriptEntry.path, output: stdout, exitCode: code });
      });

      proc.on('error', (err) => {
        resolve({
          script: scriptEntry.path,
          output: `Spawn failed: ${err.message}`,
          exitCode: 1,
        });
      });
    }
  );
}
