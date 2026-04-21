import type {
  Plugin,
  PluginInput,
  Hooks,
  AuthHook,
  ToolDefinition,
  ProviderContext,
} from '@opencode-ai/plugin';
import type { Model, UserMessage, Part, Message } from '@opencode-ai/sdk';
import type {
  ToolExecuteAfterInput,
  ToolExecuteAfterOutput,
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from './types/core';
import { initGlobalToastQueue, useGlobalToastQueue } from './core/toast-queue';
import { saveToFile } from './features/persistence/save-to-file';
import { handlers, showStartupToast } from './features/messages';
import { resolveEventConfig, resolveToolConfig } from './features/events';
import { handleDebugLog } from './core/debug';
import { runScriptAndHandle, addSubagentSession } from './features/scripts';
import { EventType } from './types/config';
import { userConfig } from './config';
import {
  UNKNOWN_EVENT_LOG_FILE,
  DEFAULT_SESSION_ID,
  BLOCKED_EVENTS_LOG_FILE,
  TOOL,
} from './core/constants';
import type { ResolvedEventConfig, ScriptResult } from './types/config';
import { executeBlocking } from './features/block-system';
import {
  initAuditLogging,
  getEventRecorder,
  getScriptRecorder,
  createEventRecorder,
} from './features/audit';
import type { ScriptRecorder } from './types/audit';

interface ExecuteHookParams {
  ctx: PluginInput;
  eventType: string;
  resolved: ResolvedEventConfig;
  sessionId: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  toolName?: string;
  scriptArg?: string;
  eventRecorder?: ReturnType<typeof createEventRecorder>;
  scriptRecorder?: ScriptRecorder;
  showToast?: boolean;
}

async function executeHook(params: ExecuteHookParams): Promise<void> {
  const {
    ctx,
    eventType,
    resolved,
    sessionId,
    input,
    output,
    toolName,
    scriptArg,
  } = params;
  const timestamp = new Date().toISOString();

  if (resolved.debug) {
    await handleDebugLog(timestamp, `DEBUG ${eventType.toUpperCase()}`, {
      input,
      output,
      resolved,
    });
  }

  if (!resolved.enabled) {
    if (!userConfig.logDisabledEvents) {
      return;
    }
    await saveToFile({
      content: JSON.stringify({
        timestamp,
        type: 'EVENT_DISABLED',
        data: eventType,
      }),
      showToast: useGlobalToastQueue().add,
    });
    return;
  }

  if (params.eventRecorder) {
    // Log ALL events with sanitized input/output for debug
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

  const results = await Promise.all(
    resolved.scripts.map((script) =>
      runScriptAndHandle({
        ctx,
        script,
        timestamp,
        eventType,
        resolved,
        scriptToasts: resolved.scriptToasts,
        sessionId,
        toolName,
        scriptArg,
        scriptRecorder: params.scriptRecorder,
      })
    )
  );

  const successfulScripts = results
    .filter(
      (result): result is { script: string; output: string } =>
        result.output !== undefined
    )
    .filter((result) => result.output.trim() !== '');

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

  const scriptResults: ScriptResult[] = results.map((r) => ({
    script: r.script,
    exitCode: r.output ? 0 : 1,
    output: r.output,
  }));

  const inputAsBeforeInput = input as ToolExecuteBeforeInput | undefined;

  executeBlocking(
    resolved.block,
    {
      tool: toolName ?? '',
      sessionID: sessionId,
      callID: inputAsBeforeInput?.callID ?? '',
    },
    output as ToolExecuteBeforeOutput,
    scriptResults,
    eventType,
    BLOCKED_EVENTS_LOG_FILE
  );
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

  await saveToFile({
    content: JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'PLUGIN_START',
      data: '|==========OpencodeHooks plugin initialized==========|',
    }),
  });

  if (!hasShownToast) {
    hasShownToast = true;
    await showStartupToast();
  }

  if (!userConfig.enabled) {
    return {};
  }

  await initAuditLogging(userConfig.audit);
  const eventRecorder = getEventRecorder();
  const scriptRecorder = getScriptRecorder();

  const hooks: Hooks = {
    event: async ({ event }) => {
      const timestamp = new Date().toISOString();
      const isKnownEvent = !!handlers[event.type];

      if (!isKnownEvent) {
        const eventRecorder = getEventRecorder();
        if (eventRecorder) {
          eventRecorder
            .logEvent('unknown', {
              input: { event },
            })
            .catch(() => {});
        } else {
          saveToFile({
            content: JSON.stringify({
              timestamp,
              type: 'UNKNOWN_EVENT',
              data: event,
            }),
            showToast: useGlobalToastQueue().add,
            filename: UNKNOWN_EVENT_LOG_FILE,
          });
        }
      }

      const resolved = resolveEventConfig(
        event.type,
        event.properties as Record<string, unknown>
      );

      const props = event.properties as Record<string, unknown>;
      const info = props?.info as Record<string, unknown> | undefined;
      const rawId = info?.id ?? props?.sessionID;
      const sessionId = typeof rawId === 'string' ? rawId : DEFAULT_SESSION_ID;

      if (event.type === EventType.SESSION_CREATED && info?.parentID) {
        addSubagentSession(sessionId);
      }

      await executeHook({
        ctx,
        eventType: event.type,
        resolved,
        sessionId,
        input: event,

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

    [EventType.TOOL_EXECUTE_AFTER]: async (
      input: ToolExecuteAfterInput,
      output: ToolExecuteAfterOutput
    ) => {
      const isTaskTool = input.tool === TOOL.TASK;
      if (isTaskTool) {
        const subagentType =
          isTaskTool && typeof input.args[TOOL.SUBAGENT_TYPE_ARG] === 'string'
            ? input.args[TOOL.SUBAGENT_TYPE_ARG]
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

    [EventType.SHELL_ENV]: async (
      input: { cwd: string; sessionID?: string; callID?: string },
      output: { env: Record<string, string> }
    ) => {
      const resolved = resolveEventConfig(EventType.SHELL_ENV, input);

      await executeHook({
        ctx,
        eventType: EventType.SHELL_ENV,
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input,
        output: output,
        toolName: EventType.SHELL_ENV,

        eventRecorder,
        scriptRecorder,
      });
    },

    [EventType.CHAT_MESSAGE]: async (
      input: {
        sessionID: string;
        agent?: string;
        model?: { providerID: string; modelID: string };
        messageID?: string;
        variant?: string;
      },
      output: { message: Record<string, unknown>; parts: Part[] }
    ) => {
      const resolved = resolveEventConfig(EventType.CHAT_MESSAGE, input);

      await executeHook({
        ctx,
        eventType: EventType.CHAT_MESSAGE,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [EventType.CHAT_PARAMS]: async (
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
      const resolved = resolveEventConfig(EventType.CHAT_PARAMS, input);

      await executeHook({
        ctx,
        eventType: EventType.CHAT_PARAMS,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [EventType.CHAT_HEADERS]: async (
      input: {
        sessionID: string;
        agent: string;
        model: Model;
        provider: ProviderContext;
        message: UserMessage;
      },
      output: { headers: Record<string, string> }
    ) => {
      const resolved = resolveEventConfig(EventType.CHAT_HEADERS, input);

      await executeHook({
        ctx,
        eventType: EventType.CHAT_HEADERS,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [EventType.PERMISSION_ASK]: async (
      input: {
        sessionID?: string;
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
      const resolved = resolveEventConfig(EventType.PERMISSION_ASK, input);

      await executeHook({
        ctx,
        eventType: EventType.PERMISSION_ASK,
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [EventType.COMMAND_EXECUTE_BEFORE]: async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: Part[] }
    ) => {
      const resolved = resolveEventConfig(
        EventType.COMMAND_EXECUTE_BEFORE,
        input
      );

      await executeHook({
        ctx,
        eventType: EventType.COMMAND_EXECUTE_BEFORE,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM]: async (
      input: Record<string, unknown>,
      output: { messages: Array<{ info: Message; parts: Part[] }> }
    ) => {
      const resolved = resolveEventConfig(
        EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM,
        input
      );

      await executeHook({
        ctx,
        eventType: EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM,
        resolved,
        sessionId: DEFAULT_SESSION_ID,
        input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [EventType.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM]: async (
      input: { sessionID?: string; model: Model },
      output: { system: string[] }
    ) => {
      const resolved = resolveEventConfig(
        EventType.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM,
        input
      );

      await executeHook({
        ctx,
        eventType: 'experimental.chat.system.transform',
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [EventType.EXPERIMENTAL_SESSION_COMPACTING]: async (
      input: { sessionID: string },
      output: { context: string[]; prompt?: string }
    ) => {
      const resolved = resolveEventConfig(
        EventType.EXPERIMENTAL_SESSION_COMPACTING,
        input
      );

      await executeHook({
        ctx,
        eventType: EventType.EXPERIMENTAL_SESSION_COMPACTING,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [EventType.EXPERIMENTAL_TEXT_COMPLETE]: async (
      input: { sessionID: string; messageID: string; partID: string },
      output: { text: string }
    ) => {
      const resolved = resolveEventConfig(
        EventType.EXPERIMENTAL_TEXT_COMPLETE,
        input
      );

      await executeHook({
        ctx,
        eventType: EventType.EXPERIMENTAL_TEXT_COMPLETE,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    [EventType.TOOL_DEFINITION]: async (
      input: { toolID: string },
      output: { description: string; parameters: Record<string, unknown> }
    ) => {
      const resolved = resolveEventConfig(EventType.TOOL_DEFINITION, input);

      await executeHook({
        ctx,
        eventType: 'tool.definition',
        resolved,
        sessionId: DEFAULT_SESSION_ID,
        input: input,
        output: output,

        eventRecorder,
        scriptRecorder,
      });
    },

    config: async (input: Record<string, unknown>) => {
      const { agent, command, sessionID, ...rest } = input;
      const eventRecorder = getEventRecorder();

      if (eventRecorder) {
        await eventRecorder.logEvent('config.file.updated', {
          sessionID: String(sessionID || 'unknown'),
          input: rest,
        });
      }
    },

    auth: {
      provider: '',
      methods: [],
    } as AuthHook,

    tool: {} as Record<string, ToolDefinition>,
  };

  return hooks;
};
