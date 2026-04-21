import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../types/core';
import type { BlockCheck, ScriptResult } from '../../types/config';
import type { BlockSystem } from '../../types/block-system';
import { useGlobalToastQueue } from '../../core/toast-queue';
import { saveToFile } from '../persistence/save-to-file';
import { BLOCKED_EVENTS_LOG_FILE } from '../../core/constants';
import { createBlockSystem } from './block-system';
import { getSecurityRecorder } from '../audit/security-recorder';

interface BlockLogData {
  sessionID?: string;
  toolName?: string;
  rule: string;
  reason?: string;
  input?: Record<string, unknown>;
}

const defaultEffects = {
  notify: (title: string, details: { message: string }) => {
    useGlobalToastQueue().add({
      title,
      message: details.message,
      variant: 'error',
      duration: 10000,
    });
  },
  log: async (data: unknown) => {
    const securityRecorder = getSecurityRecorder();
    const logData = data as BlockLogData;
    if (securityRecorder) {
      await securityRecorder.logSecurity({
        sessionID: logData.sessionID,
        toolName: logData.toolName,
        rule: logData.rule,
        reason: logData.reason,
        input: logData.input,
      });
    } else {
      saveToFile({
        content: JSON.stringify(data),
        filename: BLOCKED_EVENTS_LOG_FILE,
      });
    }
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
  const logToSecurity = async (data: unknown) => {
    const securityRecorder = getSecurityRecorder();
    const logData = data as BlockLogData;
    if (securityRecorder) {
      await securityRecorder.logSecurity({
        sessionID: logData.sessionID,
        toolName: logData.toolName,
        rule: logData.rule,
        reason: logData.reason,
        input: logData.input,
      });
    } else {
      saveToFile({
        content: JSON.stringify(data),
        filename: logFilename,
      });
    }
  };

  const effects =
    logFilename !== BLOCKED_EVENTS_LOG_FILE
      ? {
          notify: defaultEffects.notify,
          log: logToSecurity,
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

export { createBlockSystem };
