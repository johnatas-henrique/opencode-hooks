import { runScript, type ScriptResult } from './run-script';
import { appendToSession } from './append-to-session';
import { logScriptOutput } from './log-event';
import { useGlobalToastQueue } from './toast-queue';
import { DEFAULT_SESSION_ID, TOAST_DURATION } from './constants';
import type { RunScriptConfig } from './script-config';
import { saveToFile } from './save-to-file';

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
  config: RunScriptConfig
): Promise<ScriptResult> {
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
  } = config;

  const { $ } = ctx;

  if (resolved.runOnlyOnce) {
    if (isSubagent(sessionId)) {
      return { output: '', error: 'skipped for subagent', exitCode: -1 };
    }
  }

  const result: ScriptResult = scriptArg
    ? await runScript($, script, scriptArg)
    : await runScript($, script);

  const defaultScriptToasts = {
    showOutput: true,
    showError: true,
    outputVariant: 'info',
    errorVariant: 'error',
    outputDuration: TOAST_DURATION.FIVE_SECONDS,
    errorDuration: TOAST_DURATION.FIFTEEN_SECONDS,
  };

  const effectiveScriptToasts = scriptToasts ?? defaultScriptToasts;

  if (result.exitCode !== 0) {
    const showError = effectiveScriptToasts.showError ?? true;
    const errorVariant = effectiveScriptToasts.errorVariant ?? 'error';
    const errorDuration =
      effectiveScriptToasts.errorDuration ?? TOAST_DURATION.FIFTEEN_SECONDS;

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
        title: '====SCRIPT ERROR====',
        message: `Event: ${eventInfo}\nScript: ${script}\nError: ${result.error ?? 'Unknown error'}\nExit Code: ${result.exitCode}\nCheck user-events.config.ts`,
        variant: errorVariant,
        duration: errorDuration,
      });
    }

    return result;
  }

  if (resolved.saveToFile && result.output) {
    await logScriptOutput(timestamp, result.output);
  }

  if (resolved.appendToSession && result.output) {
    await appendToSession(ctx, sessionId, result.output);
  }

  return result;
}
