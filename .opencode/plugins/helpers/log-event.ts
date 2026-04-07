import { saveToFile } from './save-to-file';
import { useGlobalToastQueue } from './toast-queue';
import type { ResolvedEventConfig } from './event-types';

export async function logEventConfig(
  timestamp: string,
  eventType: string,
  input: Record<string, unknown> | undefined,
  resolved: ResolvedEventConfig
): Promise<void> {
  if (resolved.saveToFile && !eventType.startsWith('message.')) {
    await saveToFile({
      content: `[${timestamp}] - Hook: ${eventType}\nArguments: ${JSON.stringify(input, null, 2)}\nResolved Config: ${JSON.stringify(resolved, null, 2)}\n------------------------------\n`,
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
