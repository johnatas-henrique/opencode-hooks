import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../types/opencode-hooks';
import type { BlockCheck, ScriptResult } from './config';
import { useGlobalToastQueue } from './toast-queue';
import { saveToFile } from './save-to-file';
import { BLOCKED_EVENTS_LOG_FILE } from './constants';

export function executeBlocking(
  blockConfig: BlockCheck[] | undefined,
  input: ToolExecuteBeforeInput,
  output: ToolExecuteBeforeOutput,
  scriptResults: ScriptResult[],
  eventType: string,
  logFilename: string = BLOCKED_EVENTS_LOG_FILE
): void {
  if (!blockConfig || blockConfig.length === 0) {
    return;
  }
  for (const blockCheck of blockConfig) {
    const shouldBlock = blockCheck.check(input, output, scriptResults);

    if (shouldBlock) {
      const message =
        blockCheck.message || `🚫 Blocked: ${input.tool} execution`;

      useGlobalToastQueue().add({
        title: `BLOCKED - ${input.tool.toUpperCase()}`,
        message,
        variant: 'error',
        duration: 10000,
      });

      saveToFile({
        content: JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'EVENT_BLOCKED',
          data: { eventType, input, output, blockCheck },
        }),
        filename: logFilename,
      });

      throw new Error(message);
    }
  }
}
