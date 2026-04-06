import { runScript } from './run-script';
import { appendToSession } from './append-to-session';
import { logScriptOutput } from './log-event';
import { useGlobalToastQueue } from './toast-queue';
import { TOAST_DURATION, DEFAULT_SESSION_ID } from './constants';
import { isPrimarySession as isSessionPrimary } from './session';
import type { RunScriptConfig } from './run-script-types';
import { saveToFile } from './save-to-file';

const runOnceTracker = new Map<string, boolean>();

/**
 * Runs a script and handles its output, logging, and error management.
 * @param config - Configuration object containing script details and context
 */
export async function runScriptAndHandle(
  config: RunScriptConfig
): Promise<void> {
  const {
    ctx,
    script,
    scriptArg = '',
    timestamp,
    eventType,
    resolved,
    sessionId = DEFAULT_SESSION_ID,
  } = config;

  const { $ } = ctx;
  const runOnceKey = `${eventType}:${script}`;

  if (resolved.runOnlyOnce) {
    if (!isSessionPrimary(sessionId)) {
      return;
    }
    if (runOnceTracker.has(runOnceKey)) {
      return;
    }
    runOnceTracker.set(runOnceKey, true);
  }

  try {
    const output = scriptArg
      ? await runScript($, script, scriptArg)
      : await runScript($, script);

    if (resolved.saveToFile && output) {
      await logScriptOutput(timestamp, output);
    }

    if (resolved.appendToSession && output) {
      await appendToSession(ctx, sessionId, output);
    }
  } catch (err) {
    const rawError = err instanceof Error ? err.message : String(err);
    const errorMessage = rawError.replace(/[^\x20-\x7E\n]/g, (c) =>
      c.charCodeAt(0) < 32 ? '?' : c
    );

    await saveToFile({
      content: `[${timestamp}] - Script error: ${script} - ${errorMessage}\n`,
      showToast: useGlobalToastQueue().add,
    });

    useGlobalToastQueue().add({
      title: '====SCRIPT ERROR====',
      message: `Script: ${script}\nError: ${errorMessage}\nCheck user-events.config.ts`,
      variant: 'error',
      duration: TOAST_DURATION.FIVE_SECONDS,
    });
  }
}

export function resetRunOnceTracker(): void {
  runOnceTracker.clear();
}
