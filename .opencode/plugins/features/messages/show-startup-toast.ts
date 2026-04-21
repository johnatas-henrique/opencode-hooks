import { getLatestLogFile } from './plugin-status';
import { showActivePluginsToast } from './show-active-plugins';
import { waitForToastSilence } from './toast-silence-detector';
import { useGlobalToastQueue } from '../../core/toast-queue';
import { saveToFile } from '../persistence/save-to-file';
import { getErrorRecorder } from '../audit/plugin-integration';
import { TIMER, TOAST_DURATION } from '../../core/constants';
import type { StartupToastOptions } from '../../types/messages';

export async function showStartupToast(
  options: StartupToastOptions = {}
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
        const errorRecorder = getErrorRecorder();
        if (errorRecorder) {
          await errorRecorder.logError({
            error: err instanceof Error ? err : new Error(String(err)),
            context: 'showStartupToast',
          });
        } else {
          await saveToFile({
            content: JSON.stringify({
              timestamp: new Date().toISOString(),
              type: 'PLUGIN_ERROR',
              data: err,
            }),
          });
        }
      }
    });
  }
}
