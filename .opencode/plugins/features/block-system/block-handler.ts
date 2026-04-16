import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../types/core';
import type { BlockCheck, ScriptResult } from '../../types/config';
import { useGlobalToastQueue } from '../../core/toast-queue';
import { saveToFile } from '../persistence/save-to-file';
import { BLOCKED_EVENTS_LOG_FILE } from '../../core/constants';
import { createBlockSystem, type BlockSystem } from './block-system';

const defaultEffects = {
  notify: (title: string, details?: unknown) => {
    const message =
      typeof details === 'object' && details !== null && 'message' in details
        ? String((details as { message: string }).message)
        : '';
    useGlobalToastQueue().add({
      title,
      message,
      variant: 'error',
      duration: 10000,
    });
  },
  log: (data: unknown) => {
    saveToFile({
      content: JSON.stringify(data),
      filename: BLOCKED_EVENTS_LOG_FILE,
    });
  },
};

let blockSystem: BlockSystem | null = null;

function getBlockSystem(): BlockSystem {
  if (!blockSystem) {
    blockSystem = createBlockSystem(defaultEffects);
  }
  return blockSystem;
}

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

  getBlockSystem();
  const effects =
    logFilename !== BLOCKED_EVENTS_LOG_FILE
      ? {
          notify: defaultEffects.notify,
          log: (data: unknown) => {
            const d = data as { data: unknown };
            if (
              typeof d.data === 'object' &&
              d.data !== null &&
              'eventType' in d.data
            ) {
              const eventData = d.data as {
                eventType: string;
                input: unknown;
                output: unknown;
                blockCheck: unknown;
              };
              saveToFile({
                content: JSON.stringify({
                  timestamp: new Date().toISOString(),
                  type: 'EVENT_BLOCKED',
                  data: { ...eventData, filename: logFilename },
                }),
                filename: logFilename,
              });
            }
          },
        }
      : defaultEffects;

  const customSystem = createBlockSystem(effects);
  customSystem.evaluateWithEffects(
    blockConfig,
    input,
    output,
    scriptResults,
    eventType
  );
}

export {
  createBlockSystem,
  type BlockSystem,
  type BlockResult,
} from './block-system';
