import type { EventScriptConfig } from '.opencode/plugins/types/scripts';
import type { ScriptRecorder } from '.opencode/plugins/types/audit';
import { useGlobalToastQueue } from '.opencode/plugins/core/toast-queue';
import { appendToSession } from '.opencode/plugins/features/messages/append-to-session';
import {
  isSubagent,
  addSubagentSession,
} from '.opencode/plugins/features/scripts/run-script-handler';
import type {
  ScriptAuditLogger,
  SessionAppender,
  ToastNotifier,
} from '.opencode/plugins/types/executor';

export function createToastAdapter(): ToastNotifier {
  return {
    showToast(title, message, variant, duration) {
      useGlobalToastQueue().add({
        title,
        message,
        variant,
        duration,
      });
    },
  };
}

export function createSessionAdapter(
  config: EventScriptConfig
): SessionAppender {
  const { ctx } = config;
  return {
    async appendToSession(sessionId, text) {
      await appendToSession(ctx, sessionId, text);
    },
  };
}

export function createAuditAdapter(
  scriptRecorder?: ScriptRecorder
): ScriptAuditLogger | undefined {
  if (!scriptRecorder) {
    return undefined;
  }
  return {
    async logScript(input, result) {
      await scriptRecorder.logScript(input, result);
    },
  };
}

export function createSubagentTracker() {
  return {
    isSubagent(sessionId: string | undefined): boolean {
      return isSubagent(sessionId);
    },
    addSubagentSession(id: string): void {
      addSubagentSession(id);
    },
  };
}
