import { readFile } from 'fs/promises';
import { DEFAULTS } from '../../core/constants';

const TOAST_PATTERN = /path=\/tui\/show-toast/g;

export function waitForToastSilence(
  logFile: string,
  options?: { pollMs?: number; silenceMs?: number }
): { promise: Promise<void>; cleanup: () => void } {
  const pollMs = options?.pollMs ?? 200;
  const silenceMs =
    options?.silenceMs ?? DEFAULTS.toast.timeouts.ONE_SECOND_AND_HALF;

  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastCount = 0;

  const promise = new Promise<void>((resolve) => {
    const schedulePoll = () => {
      pollTimer = setTimeout(() => {
        pollTimer = null;
        check();
      }, pollMs);
      pollTimer.unref();
    };

    const check = async () => {
      try {
        const content = await readFile(logFile, 'utf-8');
        const matches = content.match(TOAST_PATTERN);
        const count = matches ? matches.length : 0;

        if (count > lastCount) {
          lastCount = count;
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(check, silenceMs);
          silenceTimer.unref();
        } else {
          if (silenceTimer) clearTimeout(silenceTimer);
          resolve();
        }
      } catch {
        if (pollTimer) clearTimeout(pollTimer);
        if (silenceTimer) clearTimeout(silenceTimer);
        resolve();
      }
    };

    schedulePoll();
    check();
  });

  const cleanup = () => {
    if (pollTimer) clearTimeout(pollTimer);
    if (silenceTimer) clearTimeout(silenceTimer);
    pollTimer = null;
    silenceTimer = null;
  };

  return { promise, cleanup };
}

export async function countToastsInLog(logFile: string): Promise<number> {
  try {
    const content = await readFile(logFile, 'utf-8');
    const matches = content.match(TOAST_PATTERN);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}
