import type {
  HookEvent,
  HookExecutorDeps,
} from '.opencode/plugins/types/executor';
import type {
  ResolvedEventConfig,
  ScriptResult,
} from '.opencode/plugins/types/config';
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

    if (this.shouldSkipRunOnlyOnce(event, rawSessionId)) return;

    if (!resolved.enabled) {
      await this.handleDisabledEvent(eventType, sessionId);
      return;
    }

    await this.recordEvent(eventType, sessionId, input, output, toolName);
    this.showMainToast(resolved);
    const results = await this.executeScripts(
      eventType,
      resolved,
      input,
      output,
      toolName,
      sessionId
    );
    this.handleStopHookState(eventType, results, sessionId);
    await this.recordScriptResults(results, toolName, eventType, sessionId);
    this.showErrorToast(resolved, results, eventType, toolName);
    this.showOutputToast(resolved, results);
    await this.appendToSession(event, resolved, results, sessionId);
    this.checkBlockedExecution(eventType, results);
  }

  private shouldSkipRunOnlyOnce(
    event: HookEvent,
    rawSessionId: string
  ): boolean {
    return event.resolved.runOnlyOnce && this.deps.isSubagent(rawSessionId);
  }

  private async handleDisabledEvent(
    eventType: string,
    sessionId: string
  ): Promise<void> {
    const shouldSkip =
      typeof this.deps.logDisabledEvents === 'function'
        ? !this.deps.logDisabledEvents()
        : !this.deps.logDisabledEvents;
    if (shouldSkip) return;

    await this.deps.eventRecorder?.logEvent('EVENT_DISABLED', {
      sessionID: sessionId,
      context: eventType,
    });
  }

  private async recordEvent(
    eventType: string,
    sessionId: string,
    input: Record<string, unknown> | undefined,
    output: Record<string, unknown> | undefined,
    toolName: string | undefined
  ): Promise<void> {
    if (!this.deps.eventRecorder) return;

    await this.deps.eventRecorder.logEvent(eventType, {
      sessionID: sessionId,
      input,
      output,
      tool: toolName,
    });
  }

  private showMainToast(resolved: ResolvedEventConfig): void {
    if (!resolved.toast) return;

    this.deps.toastQueue.add({
      title: resolved.toastTitle,
      message: resolved.toastMessage!.trim().replace(/^\s+/gm, ''),
      variant: resolved.toastVariant,
      duration: resolved.toastDuration,
    });
  }

  private async executeScripts(
    eventType: string,
    resolved: ResolvedEventConfig,
    input: Record<string, unknown> | undefined,
    output: Record<string, unknown> | undefined,
    toolName: string | undefined,
    sessionId: string
  ): Promise<ScriptResult[]> {
    const stopHookActive =
      eventType === SESSION_IDLE && this.deps.stopHook.isActive(sessionId);
    const hookInput = { ...(input ?? {}), stopHookActive };

    return Promise.all(
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
  }

  private handleStopHookState(
    eventType: string,
    results: ScriptResult[],
    sessionId: string
  ): void {
    if (eventType !== SESSION_IDLE) return;

    const anyBlocked = results.some(
      (r) => r.exitCode === 2 || r.output.includes('block')
    );

    if (anyBlocked) {
      this.deps.stopHook.setState(sessionId);
    } else {
      this.deps.stopHook.clearState(sessionId);
    }
  }

  private async recordScriptResults(
    results: ScriptResult[],
    toolName: string | undefined,
    eventType: string,
    sessionId: string
  ): Promise<void> {
    if (!this.deps.scriptRecorder) return;

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

  private showErrorToast(
    resolved: ResolvedEventConfig,
    results: ScriptResult[],
    eventType: string,
    toolName: string | undefined
  ): void {
    if (!resolved.scriptToasts?.showError) return;

    const failedScripts = results.filter((r) => r.exitCode !== 0 && r.output);
    if (failedScripts.length === 0) return;

    const errorTitle = resolved.toastTitle.replace(
      /=+$/,
      ` ${resolved.scriptToasts.errorTitle}====`
    );
    const eventInfo =
      eventType.startsWith('tool.execute.') && toolName ? toolName : eventType;

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

  private showOutputToast(
    resolved: ResolvedEventConfig,
    results: ScriptResult[]
  ): void {
    const successfulScripts = results.filter(
      (result) => result.output.trim() !== ''
    );

    if (
      !resolved.toast ||
      successfulScripts.length === 0 ||
      !resolved.scriptToasts?.showOutput
    ) {
      return;
    }

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

  private async appendToSession(
    event: HookEvent,
    resolved: ResolvedEventConfig,
    results: ScriptResult[],
    sessionId: string
  ): Promise<void> {
    if (!resolved.appendToSession) return;

    const successfulScripts = results.filter(
      (result) => result.output.trim() !== ''
    );

    for (const r of successfulScripts) {
      if (r.output) {
        await this.deps.appendToSession(event.ctx, sessionId, r.output);
      }
    }
  }

  private checkBlockedExecution(
    eventType: string,
    results: ScriptResult[]
  ): void {
    if (
      eventType !== TOOL_EXECUTE_BEFORE &&
      eventType !== COMMAND_EXECUTE_BEFORE
    ) {
      return;
    }

    const blockedScript = results.find((r) => r.exitCode === 2);
    if (blockedScript) {
      throw new Error(blockedScript.output);
    }
  }
}
