import { spawn } from 'child_process';
import path from 'path';
import type { ScriptEntry } from '.opencode/plugins/types/config';
import { DEFAULTS } from '.opencode/plugins/core/constants';
import type { HookResult } from '.opencode/plugins/types/scripts';
import { sanitizeArg } from '.opencode/plugins/features/scripts/utils';

export { sanitizeArg };

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
  'tool.execute.before.subagent': 'SubagentStart',
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
    base.tool_name = toolName.charAt(0).toUpperCase() + toolName.slice(1);
    base.tool_input = output?.args ?? input.args ?? {};
    base.tool_use_id = input.callID;
  }

  if (
    claudeEventName === 'SubagentStop' ||
    claudeEventName === 'SubagentStart'
  ) {
    base.agent_type = input.subagentType;
  }

  if (claudeEventName === 'SubagentStart') {
    base.description = (input as Record<string, unknown>).description ?? '';
    base.agent_id = input.callID;
  }

  if (claudeEventName === 'SubagentStop') {
    base.agent_id = input.callID;
    const args = (input.args as Record<string, unknown>) ?? {};
    base.description =
      typeof args.description === 'string' ? args.description : '';
    if (
      output &&
      typeof output.metadata === 'object' &&
      output.metadata !== null
    ) {
      const meta = output.metadata as Record<string, unknown>;
      if (meta.model && typeof meta.model === 'object') {
        const m = meta.model as Record<string, unknown>;
        if (typeof m.modelID === 'string') {
          base.model = m.modelID;
        }
      }
      if (typeof meta.sessionId === 'string') {
        base.agent_transcript_path = meta.sessionId;
      }
    }
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
    eventType === 'tool.execute.after.subagent' ||
    eventType === 'tool.execute.before.subagent'
  ) {
    base.agent_type = input.subagentType;
  }

  if (eventType === 'tool.execute.before.subagent') {
    base.description = (input as Record<string, unknown>).description ?? '';
    base.agent_id = input.callID;
  }

  if (eventType === 'tool.execute.after.subagent') {
    base.agent_id = input.callID;
    const args = (input.args as Record<string, unknown>) ?? {};
    base.description =
      typeof args.description === 'string' ? args.description : '';
    if (
      output &&
      typeof output.metadata === 'object' &&
      output.metadata !== null
    ) {
      const meta = output.metadata as Record<string, unknown>;
      if (meta.model && typeof meta.model === 'object') {
        const m = meta.model as Record<string, unknown>;
        if (typeof m.modelID === 'string') {
          base.model = m.modelID;
        }
      }
      if (typeof meta.sessionId === 'string') {
        base.agent_transcript_path = meta.sessionId;
      }
    }
  }

  if (eventType === 'file.watcher.updated') {
    base.file_path = input.file || '';
  }

  return base;
}

function parseScriptCommand(entry: ScriptEntry): {
  cmd: string;
  scriptPath: string;
  hasExplicitCmd: boolean;
} {
  const parts = entry.path.split(' ');
  const hasExplicitCmd = parts.length > 1 && !path.isAbsolute(parts[0]);
  if (hasExplicitCmd) {
    return {
      cmd: parts[0],
      scriptPath: resolveScriptPath(parts.slice(1).join(' ')),
      hasExplicitCmd,
    };
  }
  return {
    cmd: parts[0],
    scriptPath: resolveScriptPath(entry.path),
    hasExplicitCmd: false,
  };
}

export async function executeScript(
  scriptEntry: ScriptEntry,
  eventType: string,
  toolName: string,
  input: Record<string, unknown>,
  output?: Record<string, unknown>
): Promise<{
  script: string;
  output: string;
  exitCode: number;
  stderr?: string;
  stdin?: string;
  scriptType?: string;
}> {
  if (!validateScriptPath(scriptEntry.path)) {
    return {
      script: scriptEntry.path,
      output: `Invalid script path: ${scriptEntry.path}`,
      exitCode: 1,
      scriptType: scriptEntry.scriptType,
    };
  }

  const { cmd, scriptPath, hasExplicitCmd } = parseScriptCommand(scriptEntry);

  if (scriptEntry.async) {
    spawn(
      hasExplicitCmd ? cmd : scriptPath,
      hasExplicitCmd ? [scriptPath] : [],
      {
        stdio: 'ignore',
        env: { ...process.env, CLAUDE_PLUGIN_ROOT: process.cwd() },
      }
    ).unref();
    return {
      script: scriptEntry.path,
      output: '',
      exitCode: 0,
      scriptType: scriptEntry.scriptType,
    };
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

  return new Promise<{
    script: string;
    output: string;
    exitCode: number;
    stderr?: string;
    stdin?: string;
    scriptType?: string;
  }>((resolve) => {
    const proc = spawn(
      hasExplicitCmd ? cmd : scriptPath,
      hasExplicitCmd ? [scriptPath] : [],
      {
        stdio: stdin ? ['pipe', 'pipe', 'pipe'] : ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, CLAUDE_PLUGIN_ROOT: process.cwd() },
      }
    );

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
          stderr,
          stdin,
          scriptType: scriptEntry.scriptType,
        });
        return;
      }

      const result = parseHookOutput(stdout, stderr, code);

      if (result.action === 'block') {
        resolve({
          script: scriptEntry.path,
          output: result.reason!,
          exitCode: 2,
          stderr,
          stdin,
          scriptType: scriptEntry.scriptType,
        });
        return;
      }

      if (result.action === 'error') {
        resolve({
          script: scriptEntry.path,
          output: result.reason!,
          exitCode: code === 0 ? 1 : code,
          stderr,
          stdin,
          scriptType: scriptEntry.scriptType,
        });
        return;
      }

      resolve({
        script: scriptEntry.path,
        output: stdout,
        exitCode: code,
        stderr,
        stdin,
        scriptType: scriptEntry.scriptType,
      });
    });

    proc.on('error', (err) => {
      resolve({
        script: scriptEntry.path,
        output: `Spawn failed: ${err.message}`,
        exitCode: 1,
        stdin,
        scriptType: scriptEntry.scriptType,
      });
    });
  });
}
