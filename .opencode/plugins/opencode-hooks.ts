import type {
  Plugin,
  PluginInput,
  Hooks,
  AuthHook,
  ToolDefinition,
  ProviderContext,
} from '@opencode-ai/plugin';
import type { Model, UserMessage, Part } from '@opencode-ai/sdk';
import type {
  ToolExecuteAfterInput,
  ToolExecuteAfterOutput,
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '.opencode/plugins/types/core';
import {
  initGlobalToastQueue,
  useGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';
import { handlers } from '.opencode/plugins/features/handlers';
import { showStartupToast } from '.opencode/plugins/features/messages/show-startup-toast';
import {
  resolveEventConfig,
  resolveToolConfig,
} from '.opencode/plugins/features/events/events';
import { getEventRecorder } from '.opencode/plugins/features/audit/plugin-integration';
import {
  addSubagentSession,
  isSubagent,
} from '.opencode/plugins/features/scripts/run-script-handler';
import { appendToSession } from '.opencode/plugins/features/messages/append-to-session';
import { OpenCodeEvents } from '.opencode/plugins/types/core';
import { userConfig } from '.opencode/plugins/config/settings';
import { DEFAULTS } from '.opencode/plugins/core/constants';
import {
  executeScript,
  getStopHookActive,
  setStopHookState,
  clearStopHookState,
} from '.opencode/plugins/features/scripts/executor';
import type { ExecuteHookParams } from '.opencode/plugins/types/executor';
import {
  initAuditLogging,
  getScriptRecorder,
} from '.opencode/plugins/features/audit/plugin-integration';
import fs from 'fs';
import path from 'path';

const DEBUG_FILE = path.join(
  process.cwd(),
  'production',
  'session-logs',
  'plugin-debug.json'
);

function writeDebug(info: Record<string, unknown>) {
  try {
    fs.appendFileSync(DEBUG_FILE, JSON.stringify(info, null, 2) + '\n');
  } catch {
    // ignore
  }
}

function getCwdSafe(): string {
  try {
    return process.cwd();
  } catch {
    return '/';
  }
}

function validateScriptsDirectory(cwd: string = getCwdSafe()): void {
  const scriptsDir = path.join(cwd, DEFAULTS.scripts.dir);
  if (!fs.existsSync(scriptsDir) || !fs.statSync(scriptsDir).isDirectory()) {
    throw new Error(`Scripts directory not found: ${scriptsDir}`);
  }
}

function getNormalizedSessionId(sessionId: string): string {
  if (sessionId && sessionId.startsWith('ses_')) {
    return sessionId;
  }
  return DEFAULTS.core.defaultSessionId;
}

async function executeHook(params: ExecuteHookParams): Promise<void> {
  const {
    eventType,
    resolved,
    sessionId: rawSessionId,
    input,
    output,
    toolName,
    scriptRecorder,
  } = params;
  const sessionId = getNormalizedSessionId(rawSessionId);
  void params.eventRecorder;
  void params.ctx;

  if (resolved.runOnlyOnce && isSubagent(rawSessionId)) {
    return;
  }

  if (!resolved.enabled) {
    if (!userConfig.logDisabledEvents) {
      return;
    }
    const eventRecorder = getEventRecorder()!;
    await eventRecorder.logEvent('EVENT_DISABLED', {
      sessionID: sessionId,
      context: eventType,
    });
    return;
  }

  if (params.eventRecorder) {
    await params.eventRecorder.logEvent(eventType, {
      sessionID: sessionId,
      input: input,
      output: output,
      tool: toolName,
    });
  }

  if (resolved.toast) {
    const message = resolved.toastMessage!;

    useGlobalToastQueue().add({
      title: resolved.toastTitle,
      message: message.trim().replace(/^\s+/gm, ''),
      variant: resolved.toastVariant,
      duration: resolved.toastDuration,
    });
  }

  const stopHookActive =
    eventType === 'session.idle' && getStopHookActive(sessionId);
  const hookInput = { ...(input ?? {}), stopHookActive };

  const results = await Promise.all(
    resolved.scripts.map(async (script) => {
      return executeScript(
        script,
        eventType,
        toolName ?? '',
        hookInput,
        output
      );
    })
  );

  writeDebug({
    opencode_hooks_180: {
      eventId: Date.now(),
      line: 174,
      resolvedConfig: {
        enabled: resolved.enabled,
        toast: resolved.toast,
        toastTitle: resolved.toastTitle,
        scriptToasts: resolved.scriptToasts,
        runScripts: resolved.runScripts,
        scriptsCount: resolved.scripts.length,
      },
      eventType,
      toolName,
      sessionId,
      results,
    },
  });

  writeDebug({
    opencode_hooks_210: {
      eventId: Date.now(),
      line: 186,
      results: results.map((r) => ({
        script: r.script,
        exitCode: r.exitCode,
        output: r.output?.substring(0, 100),
      })),
    },
  });

  if (eventType === 'session.idle') {
    const anyBlocked = results.some(
      (r) => r.exitCode === 2 || r.output?.includes('block')
    );
    if (anyBlocked) {
      setStopHookState(sessionId);
    } else if (stopHookActive) {
      clearStopHookState(sessionId);
    }
  }

  if (scriptRecorder) {
    for (const r of results) {
      await scriptRecorder.logScript(
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
        ` ${resolved.scriptToasts?.errorTitle}====`
      );
      const eventInfo =
        eventType.startsWith('tool.execute.') && toolName
          ? toolName
          : eventType;
      useGlobalToastQueue().add({
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
      ` ${resolved.scriptToasts?.outputTitle}====`
    );
    useGlobalToastQueue().add({
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
        await appendToSession(params.ctx, sessionId, r.output);
      }
    }
  }

  if (
    eventType === 'tool.execute.before' ||
    eventType === 'command.execute.before'
  ) {
    const blockedScript = results.find((r) => r.exitCode === 2);
    if (blockedScript) {
      throw new Error(blockedScript.output);
    }
  }
}

let hasShownToast = false;

export const OpencodeHooks: Plugin = async (
  ctx: PluginInput
): Promise<Hooks> => {
  const { client } = ctx;

  initGlobalToastQueue((toast) => {
    client.tui.showToast({
      body: {
        title: toast.title,
        message: toast.message,
        variant: toast.variant!,
        duration: toast.duration,
      },
    });
  });

  if (!hasShownToast) {
    hasShownToast = true;
    await showStartupToast();
  }

  if (!userConfig.enabled) {
    return {};
  }

  validateScriptsDirectory();

  await initAuditLogging(userConfig.audit);

  const eventRecorder = getEventRecorder();
  const scriptRecorder = getScriptRecorder();

  const hooks: Hooks = {
    event: async ({ event }) => {
      const isKnownEvent = !!handlers[event.type];

      const props = event.properties as Record<string, unknown>;
      const info = props?.info as Record<string, unknown> | undefined;
      const rawId = info?.id ?? props?.sessionID;
      const sessionId =
        typeof rawId === 'string' ? rawId : DEFAULTS.core.defaultSessionId;

      if (!isKnownEvent) {
        const rec = getEventRecorder()!;
        await rec.logEvent('UNKNOWN_EVENT', {
          sessionID: sessionId,
          input: { event },
        });
      }

      const resolved = resolveEventConfig(
        event.type,
        event.properties as Record<string, unknown>
      );

      if (event.type === OpenCodeEvents.SESSION_CREATED && info?.parentID) {
        addSubagentSession(sessionId);
      }

      const eventInput = { ...event, ...event.properties } as Record<
        string,
        unknown
      >;

      await executeHook({
        ctx,
        eventType: event.type,
        resolved,
        sessionId,
        input: eventInput,
        eventRecorder,
        scriptRecorder,
      });
    },

    'tool.execute.before': async (
      input: ToolExecuteBeforeInput,
      output: ToolExecuteBeforeOutput
    ) => {
      const resolved = resolveToolConfig(
        'tool.execute.before',
        input.tool,
        input,
        output
      );

      await executeHook({
        ctx,
        eventType: 'tool.execute.before',
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,
        toolName: input.tool,
        scriptArg: input.tool,

        eventRecorder,
        scriptRecorder,
      });
    },

    [OpenCodeEvents.TOOL_EXECUTE_AFTER]: async (
      input: ToolExecuteAfterInput,
      output: ToolExecuteAfterOutput
    ) => {
      const isTaskTool = input.tool === DEFAULTS.core.tool.TASK;
      if (isTaskTool) {
        const subagentType =
          isTaskTool &&
          typeof input.args[DEFAULTS.core.tool.SUBAGENT_TYPE_ARG] === 'string'
            ? input.args[DEFAULTS.core.tool.SUBAGENT_TYPE_ARG]
            : '';

        const rightTool = subagentType
          ? 'tool.execute.after.subagent'
          : 'tool.execute.after';
        const resolved = resolveToolConfig(
          rightTool,
          input.tool,
          {
            ...input,
            subagentType,
          },
          output
        );

        if (subagentType) {
          resolved.toastMessage = `Agent invoked: ${subagentType}`;
        }

        await executeHook({
          ctx,
          eventType: rightTool,
          resolved: resolved,
          sessionId: input.sessionID,
          input: { ...input, subagentType } as unknown as Record<
            string,
            unknown
          >,
          output: output,
          toolName: input.tool,
          scriptArg: (subagentType || input.tool) as string,
        });
      } else {
        const isSkillTool = input.tool === 'skill';
        const skillType =
          isSkillTool && typeof input.args['name'] === 'string'
            ? input.args['name']
            : '';

        const resolved = resolveToolConfig(
          'tool.execute.after',
          input.tool,
          {
            ...input,
            skillType,
          },
          output
        );

        if (isSkillTool) {
          resolved.toastMessage = `Skill executed: ${input.args['name'] ?? ''}`;
        }

        await executeHook({
          ctx,
          eventType: 'tool.execute.after',
          resolved,
          sessionId: input.sessionID,
          input: { ...input, skillType },
          output: output,
          toolName: input.tool,
          scriptArg: skillType || input.tool,
        });
      }
    },

    [OpenCodeEvents.SHELL_ENV]: async (
      input: { cwd: string; sessionID?: string; callID?: string },
      output: { env: Record<string, string> }
    ) => {
      const resolved = resolveEventConfig(OpenCodeEvents.SHELL_ENV, input);

      await executeHook({
        ctx,
        eventType: OpenCodeEvents.SHELL_ENV,
        resolved,
        sessionId: input.sessionID!,
        input: input,
        output: output,
        toolName: OpenCodeEvents.SHELL_ENV,

        eventRecorder,
        scriptRecorder,
      });
    },

    [OpenCodeEvents.CHAT_MESSAGE]: async (
      input: {
        sessionID: string;
        agent?: string;
        model?: { providerID: string; modelID: string };
        messageID?: string;
        variant?: string;
      },
      output: { message: Record<string, unknown>; parts: Part[] }
    ) => {
      const resolved = resolveEventConfig(OpenCodeEvents.CHAT_MESSAGE, input);

      await executeHook({
        ctx,
        eventType: OpenCodeEvents.CHAT_MESSAGE,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,
        scriptArg: input.sessionID,
        eventRecorder,
        scriptRecorder,
      });
    },

    [OpenCodeEvents.CHAT_PARAMS]: async (
      input: {
        sessionID: string;
        agent: string;
        model: Model;
        provider: ProviderContext;
        message: UserMessage;
      },
      output: {
        temperature: number;
        topP: number;
        topK: number;
        options: Record<string, unknown>;
      }
    ) => {
      const resolved = resolveEventConfig(OpenCodeEvents.CHAT_PARAMS, input);

      await executeHook({
        ctx,
        eventType: OpenCodeEvents.CHAT_PARAMS,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [OpenCodeEvents.CHAT_HEADERS]: async (
      input: {
        sessionID: string;
        agent: string;
        model: Model;
        provider: ProviderContext;
        message: UserMessage;
      },
      output: { headers: Record<string, string> }
    ) => {
      const resolved = resolveEventConfig(OpenCodeEvents.CHAT_HEADERS, input);

      await executeHook({
        ctx,
        eventType: OpenCodeEvents.CHAT_HEADERS,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [OpenCodeEvents.PERMISSION_ASK]: async (
      input: {
        sessionID: string;
        tool?: string;
        id?: string;
        type?: string;
        pattern?: string | string[];
        messageID?: string;
        callID?: string;
        title?: string;
      },
      output: { status: 'ask' | 'deny' | 'allow' }
    ) => {
      const resolved = resolveEventConfig(OpenCodeEvents.PERMISSION_ASK, input);

      await executeHook({
        ctx,
        eventType: OpenCodeEvents.PERMISSION_ASK,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [OpenCodeEvents.COMMAND_EXECUTE_BEFORE]: async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: Part[] }
    ) => {
      const resolved = resolveEventConfig(
        OpenCodeEvents.COMMAND_EXECUTE_BEFORE,
        input
      );

      await executeHook({
        ctx,
        eventType: OpenCodeEvents.COMMAND_EXECUTE_BEFORE,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [OpenCodeEvents.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM]: async (
      input,
      output
    ) => {
      const resolved = resolveEventConfig(
        OpenCodeEvents.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM,
        input
      );

      await executeHook({
        ctx,
        eventType: OpenCodeEvents.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM,
        resolved,
        sessionId: DEFAULTS.core.defaultSessionId,
        input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [OpenCodeEvents.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM]: async (
      input: { sessionID?: string; model: Model },
      output: { system: string[] }
    ) => {
      const resolved = resolveEventConfig(
        OpenCodeEvents.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM,
        input
      );

      await executeHook({
        ctx,
        eventType: 'experimental.chat.system.transform',
        resolved,
        sessionId: input.sessionID ?? DEFAULTS.core.defaultSessionId,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [OpenCodeEvents.EXPERIMENTAL_SESSION_COMPACTING]: async (
      input: { sessionID: string },
      output: { context: string[]; prompt?: string }
    ) => {
      const resolved = resolveEventConfig(
        OpenCodeEvents.EXPERIMENTAL_SESSION_COMPACTING,
        input
      );

      await executeHook({
        ctx,
        eventType: OpenCodeEvents.EXPERIMENTAL_SESSION_COMPACTING,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [OpenCodeEvents.EXPERIMENTAL_TEXT_COMPLETE]: async (
      input: { sessionID: string; messageID: string; partID: string },
      output: { text: string }
    ) => {
      const resolved = resolveEventConfig(
        OpenCodeEvents.EXPERIMENTAL_TEXT_COMPLETE,
        input
      );

      await executeHook({
        ctx,
        eventType: OpenCodeEvents.EXPERIMENTAL_TEXT_COMPLETE,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [OpenCodeEvents.TOOL_DEFINITION]: async (
      input: { toolID: string },
      output: { description: string; parameters: Record<string, unknown> }
    ) => {
      const resolved = resolveEventConfig(
        OpenCodeEvents.TOOL_DEFINITION,
        input
      );

      await executeHook({
        ctx,
        eventType: 'tool.definition',
        resolved,
        sessionId: DEFAULTS.core.defaultSessionId,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    config: async (_input) => {},

    auth: {
      provider: '',
      methods: [],
    } as AuthHook,

    tool: {} as Record<string, ToolDefinition>,
  };

  return hooks;
};
