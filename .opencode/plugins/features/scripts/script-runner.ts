import type { PluginInput } from '@opencode-ai/plugin';
import type {
  EventScriptConfig,
  ScriptExecutionResult,
} from '../../types/scripts';
import type {
  ResolvedEventConfig,
  ScriptToastsConfig,
} from '../../types/config';
import type { ScriptRecorder } from '../../types/audit';
import { runScriptAndHandle } from './run-script-handler';

export interface ScriptRunnerDeps {
  ctx: PluginInput;
  sessionId: string;
  eventType: string;
  resolved: ResolvedEventConfig;
  scriptToasts: ScriptToastsConfig;
  scriptRecorder?: ScriptRecorder;
  toolName?: string;
}

export interface RunScriptOptions {
  suppressToast?: boolean;
  skipAudit?: boolean;
  skipSession?: boolean;
  runOnlyOnce?: boolean;
}

export function createScriptRunner(deps: ScriptRunnerDeps) {
  return async function runScript(
    script: string,
    arg?: string,
    options: RunScriptOptions = {}
  ): Promise<ScriptExecutionResult> {
    // Clone deps para aplicar overrides sem mutar origem
    const effectiveResolved = { ...deps.resolved };
    const effectiveScriptToasts = { ...deps.scriptToasts };

    // Aplica opções
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

    // Monta config para handler original
    const config: EventScriptConfig = {
      ctx: deps.ctx,
      script,
      scriptArg: arg,
      timestamp: Date.now().toString(),
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
