import { saveToFile } from './save-to-file';
import { useGlobalToastQueue } from './toast-queue';
import type { ResolvedEventConfig } from './event-types';

export async function logEventConfig(
  timestamp: string,
  eventType: string,
  resolved: ResolvedEventConfig
): Promise<void> {
  if (resolved.saveToFile && !eventType.startsWith('message.')) {
    await saveToFile({
      content: `[${timestamp}] - ${eventType} - ${JSON.stringify(resolved)}\n`,
      showToast: useGlobalToastQueue().add,
    });
  }
}

export async function logScriptOutput(
  timestamp: string,
  output: string
): Promise<void> {
  await saveToFile({
    content: `[${timestamp}] ${output}\n`,
    showToast: useGlobalToastQueue().add,
  });
}
