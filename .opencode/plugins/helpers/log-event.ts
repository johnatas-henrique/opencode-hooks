import { saveToFile } from './save-to-file';
import type { ToastQueue } from './toast-queue';
import type { ResolvedEventConfig } from './event-types';

export async function logEventConfig(
  timestamp: string,
  eventType: string,
  resolved: ResolvedEventConfig,
  toastQueue: ToastQueue
): Promise<void> {
  if (resolved.saveToFile && !eventType.startsWith('message.')) {
    await saveToFile({
      content: `[${timestamp}] - ${eventType} - ${JSON.stringify(resolved)}\n`,
      showToast: toastQueue.add,
    });
  }
}

export async function logScriptOutput(
  timestamp: string,
  output: string,
  toastQueue: ToastQueue
): Promise<void> {
  await saveToFile({
    content: `[${timestamp}] ${output}\n`,
    showToast: toastQueue.add,
  });
}
