import { runScript } from './run-script';
import type {
  ScriptRunResult,
  ScriptExecutionResult,
} from '../../types/scripts';
import { appendToSession } from '../messages/append-to-session';
import { useGlobalToastQueue } from '../../core/toast-queue';
import { DEFAULT_SESSION_ID } from '../../core/constants';
import type { EventScriptConfig } from '../../types/scripts';
import type { ScriptRecorder } from '../../types/audit';
import { saveToFile } from '../persistence/save-to-file';
import { truncateOutput } from '../audit/script-recorder';

const subagentSessionIds = new Set<string>();

export function isSubagent(sessionId: string | undefined): boolean {
  return !!sessionId && subagentSessionIds.has(sessionId);
}

export function addSubagentSession(sessionId: string): void {
  subagentSessionIds.add(sessionId);
}

export function resetSubagentTracking(): void {
  subagentSessionIds.clear();
}

export async function runScriptAndHandle(
  config: EventScriptConfig & { scriptRecorder?: ScriptRecorder }
): Promise<ScriptExecutionResult> {
  const {
    ctx,
    script,
    scriptArg = '',
    timestamp,
    eventType,
    toolName,
    resolved,
    scriptToasts,
    sessionId = DEFAULT_SESSION_ID,
    scriptRecorder,
  } = config;

  const { $ } = ctx;

  if (resolved.runOnlyOnce) {
    if (isSubagent(sessionId)) {
      return { script, output: undefined };
    }
  }

  const result: ScriptRunResult = scriptArg
    ? await runScript($, script, scriptArg)
    : await runScript($, script);

  const effectiveScriptToasts = scriptToasts;
  const eventTitle = resolved.toastTitle;

  if (result.exitCode !== 0) {
    const showError = effectiveScriptToasts.showError;
    const errorVariant = effectiveScriptToasts.errorVariant;
    const errorDuration = effectiveScriptToasts.errorDuration;
    const errorTitle = eventTitle.replace(
      /=+$/,
      ` ${effectiveScriptToasts.errorTitle}====`
    );

    const eventInfo =
      eventType.startsWith('tool.execute.') && toolName ? toolName : eventType;

    await saveToFile({
      content: JSON.stringify({
        timestamp,
        type: 'SCRIPT_ERROR',
        data: {
          eventType,
          toolName,
          script,
          error: result.error,
          exitCode: result.exitCode,
        },
      }),
      showToast: useGlobalToastQueue().add,
    });

    if (showError) {
      useGlobalToastQueue().add({
        title: errorTitle,
        message: `Event: ${eventInfo}\nScript: ${script}\nError: ${result.error}\nExit Code: ${result.exitCode}\nCheck settings.ts`,
        variant: errorVariant,
        duration: errorDuration,
      });
    }

    return { script, output: undefined };
  }

  if (resolved.saveToFile && result.output) {
    const outputToLog = script.endsWith('.sh')
      ? truncateOutput(result.output)
      : result.output;

    if (scriptRecorder) {
      await scriptRecorder.logScript(
        { script, args: scriptArg ? [scriptArg] : [], startTime: Date.now() },
        { output: outputToLog, error: null, exitCode: result.exitCode }
      );
    }
  }

  if (resolved.appendToSession && result.output) {
    await appendToSession(ctx, sessionId, result.output);
  }

  return { script, output: result.output };
}
