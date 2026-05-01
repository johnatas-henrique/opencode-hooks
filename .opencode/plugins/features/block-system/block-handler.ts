import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '.opencode/plugins/types/core';
import type { BlockCheck, ScriptResult } from '.opencode/plugins/types/config';
import type {
  BlockSystem,
  BlockLogData,
} from '.opencode/plugins/types/block-system';
import { useGlobalToastQueue } from '.opencode/plugins/core/toast-queue';
import { createBlockSystem } from '.opencode/plugins/types/block-system';
import { getSecurityRecorder } from '.opencode/plugins/features/audit/security-recorder';

export function createDefaultNotifyEffect() {
  return (title: string, details: { message: string }) => {
    useGlobalToastQueue().add({
      title,
      message: details.message,
      variant: 'error',
      duration: 10000,
    });
  };
}

export function createDefaultLogEffect() {
  return async (data: unknown) => {
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
  };
}

const defaultEffects = {
  notify: createDefaultNotifyEffect(),
  log: createDefaultLogEffect(),
};

let blockSystem: BlockSystem | null = null;

export function getBlockSystem(): BlockSystem {
  if (!blockSystem) {
    blockSystem = createBlockSystem(defaultEffects);
  }
  return blockSystem;
}

export function executeBlocking(
  blockConfig: BlockCheck[],
  input: ToolExecuteBeforeInput,
  output: ToolExecuteBeforeOutput,
  scriptResults: ScriptResult[],
  eventType: string
): void {
  if (blockConfig.length === 0) {
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
    rule: blockConfig[0].message,
    reason: blockConfig[0].message,
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
