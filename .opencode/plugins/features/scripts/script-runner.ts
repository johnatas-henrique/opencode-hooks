import type {
  EventScriptConfig,
  ScriptExecutionResult,
} from '../../types/scripts';
import { runScriptAndHandle } from './run-script-handler';
import type {
  ScriptRunnerDeps,
  ScriptExecutorOptions,
} from '../../types/executor';

export function createScriptRunner(deps: ScriptRunnerDeps) {
  return async function runScript(
    script: string,
    arg?: string,
    options: ScriptExecutorOptions = {}
  ): Promise<ScriptExecutionResult> {
    const effectiveResolved = { ...deps.resolved };
    const effectiveScriptToasts = { ...deps.scriptToasts };

    if (options.suppressToast) {
      effectiveScriptToasts.showError = false;
    }
    if (options.skipAudit) {
      effectiveResolved.logToAudit = false;
    }
    if (options.skipSession) {
      effectiveResolved.appendToSession = false;
    }
    if (options.runOnlyOnce !== undefined) {
      effectiveResolved.runOnlyOnce = options.runOnlyOnce;
    }

    const config: EventScriptConfig = {
      ctx: deps.ctx,
      script,
      scriptArg: arg,
      timestamp: deps.timestamp ?? Date.now().toString(),
      eventType: deps.eventType,
      toolName: deps.toolName,
      resolved: effectiveResolved,
      scriptToasts: effectiveScriptToasts,
      sessionId: deps.sessionId,
    };

    return runScriptAndHandle({
      ...config,
      scriptRecorder: deps.scriptRecorder,
    });
  };
}
