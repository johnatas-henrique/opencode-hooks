import { runScript } from './run-script';
import { appendToSession } from './append-to-session';
import { logScriptOutput } from './log-event';
import { useGlobalToastQueue } from './toast-queue';
import { TOAST_DURATION } from './constants';
import { isPrimarySession } from './session';
import type { RunScriptConfig } from './run-script-types';
import { saveToFile } from './save-to-file';

const runOnceTracker = new Map<string, boolean>();

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
    sessionId,
  } = config;

  const { $ } = ctx;
  const runOnceKey = `${eventType}:${script}`;

  if (resolved.runOnlyOnce && runOnceTracker.has(runOnceKey)) {
    return;
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
    const errorMessage = err instanceof Error ? err.message : String(err);

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

  if (resolved.runOnlyOnce && isPrimarySession(sessionId)) {
    runOnceTracker.set(runOnceKey, true);
  }
}

export function resetRunOnceTracker(): void {
  runOnceTracker.clear();
}
