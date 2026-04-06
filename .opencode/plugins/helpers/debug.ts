import { useGlobalToastQueue } from './toast-queue';
import { saveToFile } from './save-to-file';
import { TOAST_DURATION, DEBUG_LOG_FILE } from './constants';

export async function handleDebugLog(
  timestamp: string,
  title: string,
  data: unknown
): Promise<void> {
  const debugMessage = JSON.stringify(data, null, 2);

  useGlobalToastQueue().add({
    title,
    message: debugMessage,
    variant: 'info',
    duration: TOAST_DURATION.TEN_SECONDS,
  });

  await saveToFile({
    content: `[${timestamp}] - ${title}\n${debugMessage}\n`,
    filename: DEBUG_LOG_FILE,
    showToast: useGlobalToastQueue().add,
  });
}
