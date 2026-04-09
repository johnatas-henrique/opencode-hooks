import { getLatestLogFile } from './plugin-status';
import {
  showActivePluginsToast,
  waitForToastSilence,
  useGlobalToastQueue,
} from './index';
import { saveToFile } from './save-to-file';
import { TIMER, TOAST_DURATION } from './constants';

export interface ShowStartupToastOptions {
  getLogFile?: () => string | null;
}

export async function showStartupToast(
  options: ShowStartupToastOptions = {}
): Promise<void> {
  const getLogFile = options.getLogFile ?? getLatestLogFile;
  const logFile = getLogFile();
  const toastQueue = useGlobalToastQueue();

  toastQueue.add({
    title: 'Loading plugin status...',
    message: 'Scanning OpenCode plugins',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
  });

  if (logFile) {
    const { promise, cleanup } = waitForToastSilence(logFile);
    let timeoutTimer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<void>((resolve) => {
      timeoutTimer = setTimeout(resolve, TOAST_DURATION.TEN_SECONDS);
      timeoutTimer.unref();
    });

    Promise.race([promise, timeout]).then(async () => {
      clearTimeout(timeoutTimer!);
      cleanup();

      await new Promise((resolve) => {
        const delayTimer = setTimeout(resolve, TIMER.OVERWRITE_CHECK_DELAY);
        delayTimer.unref();
      });

      try {
        await showActivePluginsToast(toastQueue, {
          duration: TOAST_DURATION.FIVE_SECONDS,
        });
      } catch (err) {
        await saveToFile({
          content: `[${new Date().toISOString()}] - Startup toast error: ${err}\n`,
        });
      }
    });
  }
}
