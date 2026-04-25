import type {
  ScriptExecutorDeps,
  ScriptExecutorOptions,
  ScriptInput,
  ScriptResultForAudit,
} from '../../types/executor';
import type {
  ScriptRunResult,
  ScriptExecutionResult,
} from '../../types/scripts';
import type { EventVariant } from '../../types/config';

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

    // Run-only-once gating
    if (options.runOnlyOnce ?? false) {
      if (this.deps.isSubagent(sessionId)) {
        return { script, output: undefined };
      }
    }

    // Execute script
    const result: ScriptRunResult = arg
      ? await this.deps.executeScript(script, arg)
      : await this.deps.executeScript(script);

    // Error handling
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
      };
      const scriptResult: ScriptResultForAudit = {
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
      };

      // Audit log on error (always if audit provided, regardless of skipAudit)
      if (this.deps.audit) {
        await this.deps.audit.logScript(scriptData, scriptResult);
      }

      // Toast on error
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

    // Success: audit log
    if (!options.skipAudit && this.deps.audit && result.output) {
      await this.deps.audit.logScript(
        { script, args: arg ? [arg] : [], startTime: Date.now() },
        { output: result.output, error: null, exitCode: result.exitCode }
      );
    }

    // Success: session append
    if (!options.skipSession && result.output) {
      if (this.deps.session) {
        await this.deps.session.appendToSession(sessionId, result.output);
      }
    }

    return { script, output: result.output };
  }
}
