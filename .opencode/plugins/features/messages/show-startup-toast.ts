import { getLatestLogFile } from '.opencode/plugins/features/messages/plugin-status';
import { showActivePluginsToast } from '.opencode/plugins/features/messages/show-active-plugins';
import { waitForToastSilence } from '.opencode/plugins/features/messages/toast-silence-detector';
import { useGlobalToastQueue } from '.opencode/plugins/core/toast-queue';
import { getErrorRecorder } from '.opencode/plugins/features/audit/plugin-integration';
import { DEFAULTS } from '.opencode/plugins/core/constants';
import type { StartupToastOptions } from '.opencode/plugins/types/messages';

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
    duration: DEFAULTS.toast.durations.TWO_SECONDS,
  });

  if (logFile) {
    const { promise, cleanup } = waitForToastSilence(logFile);
    let timeoutTimer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<void>((resolve) => {
      timeoutTimer = setTimeout(resolve, DEFAULTS.toast.durations.TEN_SECONDS);
      timeoutTimer.unref();
    });

    Promise.race([promise, timeout]).then(async () => {
      clearTimeout(timeoutTimer!);
      cleanup();

      await new Promise((resolve) => {
        const delayTimer = setTimeout(
          resolve,
          DEFAULTS.toast.timer.OVERWRITE_CHECK_DELAY
        );
        delayTimer.unref();
      });

      try {
        await showActivePluginsToast(toastQueue, {
          duration: DEFAULTS.toast.durations.FIVE_SECONDS,
        });
      } catch (err) {
        await getErrorRecorder()?.logError({
          error: err instanceof Error ? err : new Error(String(err)),
          context: 'showStartupToast',
        });
      }
    });
  }
}
