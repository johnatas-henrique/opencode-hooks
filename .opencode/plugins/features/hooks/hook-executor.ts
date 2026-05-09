import type {
  HookEvent,
  HookExecutorDeps,
} from '.opencode/plugins/types/executor';
import { isSubagent } from '.opencode/plugins/features/scripts/run-script-handler';
import { appendToSession } from '.opencode/plugins/features/messages/append-to-session';
import {
  executeScript,
  getStopHookActive,
  setStopHookState,
  clearStopHookState,
} from '.opencode/plugins/features/scripts/executor';
import {
  getEventRecorder,
  getScriptRecorder,
} from '.opencode/plugins/features/audit/plugin-integration';
import { useGlobalToastQueue } from '.opencode/plugins/core/toast-queue';
import { userConfig } from '.opencode/plugins/config/settings';

const SESSION_IDLE = 'session.idle';
const TOOL_EXECUTE_BEFORE = 'tool.execute.before';
const COMMAND_EXECUTE_BEFORE = 'command.execute.before';

function getNormalizedSessionId(sessionId: string): string {
  if (sessionId && sessionId.startsWith('ses_')) {
    return sessionId;
  }
  return 'ses_default';
}

export function createHookExecutor(): HookExecutor {
  return new HookExecutor({
    executeScript,
    isSubagent,
    appendToSession,
    stopHook: {
      isActive: getStopHookActive,
      setState: setStopHookState,
      clearState: clearStopHookState,
    },
    toastQueue: useGlobalToastQueue(),
    eventRecorder: getEventRecorder(),
    scriptRecorder: getScriptRecorder(),
    logDisabledEvents: () => userConfig.logDisabledEvents,
  });
}

export class HookExecutor {
  constructor(private readonly deps: HookExecutorDeps) {}

  async execute(event: HookEvent): Promise<void> {
    const {
      eventType,
      resolved,
      sessionId: rawSessionId,
      input,
      output,
      toolName,
    } = event;
    const sessionId = getNormalizedSessionId(rawSessionId);

    if (resolved.runOnlyOnce && this.deps.isSubagent(rawSessionId)) {
      return;
    }

    if (!resolved.enabled) {
      const shouldSkip =
        typeof this.deps.logDisabledEvents === 'function'
          ? !this.deps.logDisabledEvents()
          : !this.deps.logDisabledEvents;
      if (shouldSkip) {
        return;
      }
      await this.deps.eventRecorder?.logEvent('EVENT_DISABLED', {
        sessionID: sessionId,
        context: eventType,
      });
      return;
    }

    if (this.deps.eventRecorder) {
      await this.deps.eventRecorder.logEvent(eventType, {
        sessionID: sessionId,
        input: input,
        output: output,
        tool: toolName,
      });
    }

    if (resolved.toast) {
      this.deps.toastQueue.add({
        title: resolved.toastTitle,
        message: resolved.toastMessage!.trim().replace(/^\s+/gm, ''),
        variant: resolved.toastVariant,
        duration: resolved.toastDuration,
      });
    }

    const stopHookActive =
      eventType === SESSION_IDLE && this.deps.stopHook.isActive(sessionId);
    const hookInput = { ...(input ?? {}), stopHookActive };

    const results = await Promise.all(
      resolved.scripts.map(async (script) => {
        return this.deps.executeScript(
          script,
          eventType,
          toolName ?? '',
          hookInput,
          output
        );
      })
    );

    if (eventType === SESSION_IDLE) {
      const anyBlocked = results.some(
        (r) => r.exitCode === 2 || r.output.includes('block')
      );
      if (anyBlocked) {
        this.deps.stopHook.setState(sessionId);
      } else if (stopHookActive) {
        this.deps.stopHook.clearState(sessionId);
      }
    }

    if (this.deps.scriptRecorder) {
      for (const r of results) {
        await this.deps.scriptRecorder.logScript(
          {
            script: r.script,
            args: toolName ? [toolName] : [eventType],
            startTime: Date.now(),
            sessionId,
          },
          {
            output: r.output,
            error: r.exitCode === 0 ? null : r.output,
            exitCode: r.exitCode,
          }
        );
      }
    }

    if (resolved.scriptToasts?.showError) {
      const failedScripts = results.filter((r) => r.exitCode !== 0 && r.output);
      if (failedScripts.length > 0) {
        const errorTitle = resolved.toastTitle.replace(
          /=+$/,
          ` ${resolved.scriptToasts.errorTitle}====`
        );
        const eventInfo =
          eventType.startsWith('tool.execute.') && toolName
            ? toolName
            : eventType;
        this.deps.toastQueue.add({
          title: errorTitle,
          message: failedScripts
            .map(
              (r) =>
                `Event: ${eventInfo}\nScript: ${r.script}\nError: ${r.output}\nExit Code: ${r.exitCode}\nCheck settings.ts`
            )
            .join('\n\n'),
          variant: resolved.scriptToasts.errorVariant,
          duration: resolved.scriptToasts.errorDuration,
        });
      }
    }

    const successfulScripts = results.filter(
      (result) => result.output.trim() !== ''
    );

    if (
      resolved.toast &&
      successfulScripts.length > 0 &&
      resolved.scriptToasts?.showOutput
    ) {
      const outputTitle = resolved.toastTitle.replace(
        /=+$/,
        ` ${resolved.scriptToasts.outputTitle}====`
      );
      this.deps.toastQueue.add({
        title: outputTitle,
        message: successfulScripts
          .map((result) => `- ${result.script}:\n${result.output}`)
          .join('\n\n'),
        variant: resolved.scriptToasts.outputVariant,
        duration: resolved.scriptToasts.outputDuration,
      });
    }

    if (resolved.appendToSession) {
      for (const r of successfulScripts) {
        if (r.output) {
          await this.deps.appendToSession(event.ctx, sessionId, r.output);
        }
      }
    }

    if (
      eventType === TOOL_EXECUTE_BEFORE ||
      eventType === COMMAND_EXECUTE_BEFORE
    ) {
      const blockedScript = results.find((r) => r.exitCode === 2);
      if (blockedScript) {
        throw new Error(blockedScript.output);
      }
    }
  }
}
