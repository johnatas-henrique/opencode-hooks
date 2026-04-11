import { runScript } from './run-script';
import { appendToSession } from './append-to-session';
import { logScriptOutput } from './log-event';
import { useGlobalToastQueue } from './toast-queue';
import { TOAST_DURATION, DEFAULT_SESSION_ID } from './constants';
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
    toolName,
    resolved,
    sessionId = DEFAULT_SESSION_ID,
  } = config;

  const { $ } = ctx;

  if (resolved.runOnlyOnce) {
    if (isSubagent(sessionId)) {
      return;
    }
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

    const eventInfo =
      eventType.startsWith('tool.execute.') && toolName ? toolName : eventType;

    await saveToFile({
      content: JSON.stringify({
        timestamp,
        type: 'SCRIPT_ERROR',
        data: { eventType, toolName, script, errorMessage },
      }),
      showToast: useGlobalToastQueue().add,
    });

    useGlobalToastQueue().add({
      title: '====SCRIPT ERROR====',
      message: `Event: ${eventInfo}\nScript: ${script}\nError: ${errorMessage}\nCheck user-events.config.ts`,
      variant: 'error',
      duration: TOAST_DURATION.FIVE_SECONDS,
    });
  }
}
