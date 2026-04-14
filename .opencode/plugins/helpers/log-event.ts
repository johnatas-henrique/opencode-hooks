import { saveToFile } from './save-to-file';
import { useGlobalToastQueue } from './toast-queue';
import type { ResolvedEventConfig } from '../types/config';

export async function logEventConfig(
  timestamp: string,
  eventType: string,
  input: Record<string, unknown> | undefined,
  resolved: ResolvedEventConfig,
  output?: Record<string, unknown>
): Promise<void> {
  if (resolved.saveToFile && !eventType.startsWith('message.')) {
    await saveToFile({
      content: JSON.stringify({
        timestamp,
        type: 'EVENT_OUTPUT',
        data: {
          eventType,
          input,
          output,
          resolvedConfig: resolved,
        },
      }),
      showToast: useGlobalToastQueue().add,
    });
  }
}

export async function logScriptOutput(
  timestamp: string,
  output: string
): Promise<void> {
  await saveToFile({
    content: JSON.stringify({
      timestamp,
      type: 'SCRIPT_OUTPUT',
      data: output,
    }),
    showToast: useGlobalToastQueue().add,
  });
}
