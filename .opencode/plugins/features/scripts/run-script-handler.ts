import { runScript } from '.opencode/plugins/features/scripts/run-script';
import type {
  ScriptExecutionResult,
  EventScriptConfig,
} from '.opencode/plugins/types/scripts';
import type { ScriptRecorder } from '.opencode/plugins/types/audit';
import { ScriptExecutor } from '.opencode/plugins/features/scripts/script-executor';
import {
  createAuditAdapter,
  createSessionAdapter,
  createToastAdapter,
} from '.opencode/plugins/features/scripts/adapters';
import { DEFAULTS } from '.opencode/plugins/core/constants';

const subagentSessionIds = new Set<string>();

export function isSubagent(sessionId: string | undefined): boolean {
  return !!sessionId && subagentSessionIds.has(sessionId);
}

export function addSubagentSession(sessionId: string): void {
  subagentSessionIds.add(sessionId);
}

export async function runScriptAndHandle(
  config: EventScriptConfig & { scriptRecorder?: ScriptRecorder }
): Promise<ScriptExecutionResult> {
  const { resolved, scriptToasts, scriptRecorder, timestamp } = config;

  // Build ScriptExecutor with injected dependencies
  const executor = new ScriptExecutor({
    executeScript: (script, arg) =>
      runScript(config.ctx.$, script, ...(arg !== undefined ? [arg] : [])),
    audit: createAuditAdapter(scriptRecorder),
    session: createSessionAdapter(config),
    toast: createToastAdapter(),
    isSubagent: (sessionId) => isSubagent(sessionId),
  });

  return executor.execute(
    config.script,
    config.scriptArg,
    {
      skipAudit: !resolved.logToAudit,
      skipSession: !resolved.appendToSession,
      suppressToast: !resolved.scriptToasts?.showError,
      runOnlyOnce: resolved.runOnlyOnce,
    },
    {
      eventType: config.eventType,
      toolName: config.toolName,
      toastTitle: resolved.toastTitle,
      scriptToasts: {
        showError: scriptToasts.showError,
        errorVariant: scriptToasts.errorVariant,
        errorDuration: scriptToasts.errorDuration,
        errorTitle: scriptToasts.errorTitle,
      },
      timestamp: timestamp,
      sessionId: config.sessionId || DEFAULTS.core.defaultSessionId,
    }
  );
}
