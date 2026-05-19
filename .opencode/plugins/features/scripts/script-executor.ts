import type {
  ScriptExecutorDeps,
  ScriptExecutorOptions,
  ScriptInput,
  ScriptResultForAudit,
} from '.opencode/plugins/types/executor';
import type {
  ScriptRunResult,
  ScriptExecutionResult,
} from '.opencode/plugins/types/scripts';
import type { EventVariant } from '.opencode/plugins/types/config';

export class ScriptExecutor {
  constructor(private deps: ScriptExecutorDeps) {}

  async execute(
    script: string,
    arg: string | undefined,
    options: ScriptExecutorOptions = {},
    eventContext: {
      eventType: string;
      toolName?: string;
      toastTitle: string;
      scriptToasts: {
        showError: boolean;
        errorVariant: EventVariant;
        errorDuration: number;
        errorTitle: string;
      };
      timestamp: string;
      sessionId: string;
    }
  ): Promise<ScriptExecutionResult> {
    const {
      eventType,
      toolName,
      toastTitle,
      scriptToasts,
      timestamp,
      sessionId,
    } = eventContext;

    if (options.runOnlyOnce ?? false) {
      if (this.deps.isSubagent(sessionId)) {
        return { script, output: undefined };
      }
    }

    const result: ScriptRunResult = arg
      ? await this.deps.executeScript(script, arg)
      : await this.deps.executeScript(script);

    if (result.exitCode !== 0) {
      const showError = scriptToasts.showError;
      const errorVariant = scriptToasts.errorVariant;
      const errorDuration = scriptToasts.errorDuration;
      const errorTitle = toastTitle.replace(
        /=+$/,
        ` ${scriptToasts.errorTitle}====`
      );

      const eventInfo =
        eventType.startsWith('tool.execute.') && toolName
          ? toolName
          : eventType;

      const scriptData: ScriptInput = {
        script,
        args: arg ? [arg] : [],
        startTime: new Date(timestamp).getTime(),
        stdin: result.stdin,
      };
      const scriptResult: ScriptResultForAudit = {
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
      };

      if (this.deps.audit) {
        await this.deps.audit.logScript(scriptData, scriptResult);
      }

      if (showError && !options.suppressToast && this.deps.toast) {
        this.deps.toast.showToast(
          errorTitle,
          `Event: ${eventInfo}\nScript: ${script}\nError: ${result.error}\nExit Code: ${result.exitCode}\nCheck settings.ts`,
          errorVariant,
          errorDuration
        );
      }

      return { script, output: undefined };
    }

    if (!options.skipAudit && this.deps.audit && result.output) {
      await this.deps.audit.logScript(
        {
          script,
          args: arg ? [arg] : [],
          startTime: Date.now(),
          stdin: result.stdin,
        },
        { output: result.output, error: null, exitCode: result.exitCode }
      );
    }

    if (!options.skipSession && result.output) {
      await this.deps.session.appendToSession(sessionId, result.output);
    }

    return { script, output: result.output };
  }
}
