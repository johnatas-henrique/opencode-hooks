import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../types/core';
import type { BlockCheck, ScriptResult } from '../../types/config';
import type { BlockSystem } from '../../types/block-system';
import { useGlobalToastQueue } from '../../core/toast-queue';
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
  eventType: string
): void {
  if (!blockConfig || blockConfig.length === 0) {
    return;
  }

  getBlockSystem();
  const securityRecorder = getSecurityRecorder();
  if (!securityRecorder) {
    return; // Não temos como logar, apenas notifique via toast
  }

  const logData = {
    sessionID: input.sessionID,
    toolName: input.tool,
    rule: blockConfig[0].message || 'Blocked',
    reason: blockConfig[0].message || 'Blocked',
    input: input,
  };

  // Logassíncrono, não bloqueante
  securityRecorder.logSecurity(logData).catch(() => {});

  const customSystem = createBlockSystem(defaultEffects);
  customSystem.evaluateWithEffects(
    blockConfig,
    input,
    output,
    scriptResults,
    eventType
  );
}

export { createBlockSystem };
