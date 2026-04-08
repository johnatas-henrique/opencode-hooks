import type {
  Plugin,
  PluginInput,
  Hooks,
  AuthHook,
  ToolDefinition,
  ProviderContext,
} from '@opencode-ai/plugin';
import type { Model, UserMessage } from '@opencode-ai/sdk';
import {
  ToolExecuteAfterInput,
  ToolExecuteAfterOutput,
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from './types/opencode-hooks';
import {
  initGlobalToastQueue,
  useGlobalToastQueue,
  saveToFile,
  handlers,
  resolveEventConfig,
  resolveToolConfig,
  showStartupToast,
  logEventConfig,
  handleDebugLog,
  runScriptAndHandle,
  EventType,
} from './helpers';
import { userConfig } from './helpers/user-events.config';
import {
  UNKNOWN_EVENT_LOG_FILE,
  DEFAULT_SESSION_ID,
} from './helpers/constants';
import type { ResolvedEventConfig } from './helpers/config';

const TASK_TOOL_NAME = 'task';
const SUBAGENT_TYPE_ARG = 'subagent_type';

interface ExecuteHookParams {
  ctx: PluginInput;
  eventType: string;
  resolved: ResolvedEventConfig;
  sessionId: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  toolName?: string;
  scriptArg?: string;
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
    await saveToFile({
      content: `[${timestamp}] - Skipping disabled hook: ${eventType}\n`,
      showToast: useGlobalToastQueue().add,
    });
    return;
  }

  await logEventConfig(timestamp, eventType, input, resolved);

  if (resolved.toast) {
    const handler = handlers[eventType];
    const message =
      resolved.toastMessage ??
      (handler
        ? handler.buildMessage((input ?? {}) as Record<string, unknown>)
        : eventType);

    useGlobalToastQueue().add({
      title: resolved.toastTitle,
      message: message.trim().replace(/^\s+/gm, ''),
      variant: resolved.toastVariant,
      duration: resolved.toastDuration,
    });
  }

  for (const script of resolved.scripts) {
    await runScriptAndHandle({
      ctx,
      script,
      timestamp,
      eventType,
      resolved,
      sessionId,
      toolName,
      scriptArg,
    });
  }
}

let hasShownToast = false;

export const OpencodeHooks: Plugin = async (
  ctx: PluginInput
): Promise<Hooks> => {
  const { client } = ctx;

  if (!userConfig.enabled) {
    return {
      event: async () => {},
      [EventType.TOOL_EXECUTE_BEFORE]: async () => {},
      [EventType.TOOL_EXECUTE_AFTER]: async () => {},
      [EventType.SHELL_ENV]: async () => {},
      [EventType.CHAT_MESSAGE]: async () => {},
      [EventType.CHAT_PARAMS]: async () => {},
      [EventType.CHAT_HEADERS]: async () => {},
      [EventType.PERMISSION_ASK]: async () => {},
      [EventType.COMMAND_EXECUTE_BEFORE]: async () => {},
      [EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM]: async () => {},
      [EventType.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM]: async () => {},
      [EventType.EXPERIMENTAL_SESSION_COMPACTING]: async () => {},
      [EventType.EXPERIMENTAL_TEXT_COMPLETE]: async () => {},
      [EventType.TOOL_DEFINITION]: async () => {},
      config: async () => {},
      auth: undefined,
      tool: undefined,
    };
  }

  initGlobalToastQueue((toast) => {
    client.tui.showToast({
      body: {
        title: toast.title,
        message: toast.message,
        variant: toast.variant ?? 'info',
        duration: toast.duration,
      },
    });
  });

  await saveToFile({
    content: `|=================================OpencodeHooks plugin initialized=================================|\n[${new Date().toISOString()}] - Configuration loaded from user-events.config.ts\n`,
  });

  if (!hasShownToast) {
    hasShownToast = true;
    await showStartupToast();
  }

  const hooks: Hooks = {
    event: async ({ event }) => {
      const timestamp = new Date().toISOString();
      const isKnownEvent = !!handlers[event.type];

      if (!isKnownEvent) {
        await saveToFile({
          content: `===================UNKNOWN EVENT======================\n[${timestamp}] - [WARN] Event: ${event.type} is not configured.\n${JSON.stringify(event, null, 2)}\n`,
          showToast: useGlobalToastQueue().add,
          filename: UNKNOWN_EVENT_LOG_FILE,
        });
      }

      const resolved = resolveEventConfig(event.type);

      const props = event.properties as Record<string, unknown>;
      const info = props?.info as Record<string, unknown> | undefined;
      const rawId = info?.id ?? props?.sessionID;
      const sessionId = typeof rawId === 'string' ? rawId : DEFAULT_SESSION_ID;

      await executeHook({
        ctx,
        eventType: event.type,
        resolved,
        sessionId,
        input: event as unknown as Record<string, unknown>,
      });
    },

    'tool.execute.before': async (
      input: ToolExecuteBeforeInput,
      output: ToolExecuteBeforeOutput
    ) => {
      const resolved = resolveToolConfig('tool.execute.before', input.tool);

      await executeHook({
        ctx,
        eventType: 'tool.execute.before',
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
        toolName: input.tool,
        scriptArg: input.tool,
      });
    },

    [EventType.TOOL_EXECUTE_AFTER]: async (
      input: ToolExecuteAfterInput,
      output: ToolExecuteAfterOutput
    ) => {
      const isTaskTool = input.tool === TASK_TOOL_NAME;
      if (isTaskTool) {
        const subagentType =
          isTaskTool && typeof input.args[SUBAGENT_TYPE_ARG] === 'string'
            ? input.args[SUBAGENT_TYPE_ARG]
            : '';

        const rightTool = subagentType
          ? 'tool.execute.after.subagent'
          : 'tool.execute.after';
        const resolved = resolveToolConfig(rightTool, input.tool);

        resolved.toastMessage = `Agent invoked: ${subagentType}`;

        await executeHook({
          ctx,
          eventType: rightTool,
          resolved: resolved,
          sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
          input: { ...input, subagentType } as unknown as Record<
            string,
            unknown
          >,
          output: output as unknown as Record<string, unknown>,
          toolName: input.tool,
          scriptArg: subagentType || input.tool,
        });
      } else {
        const resolved = resolveToolConfig('tool.execute.after', input.tool);

        const isSkillTool = input.tool === 'skill';
        const skillType =
          isSkillTool && typeof input.args['name'] === 'string'
            ? input.args['name']
            : '';

        if (isSkillTool) {
          resolved.toastMessage = `Skill executed: ${input.args['name'] ?? ''}`;
        }

        await executeHook({
          ctx,
          eventType: 'tool.execute.after',
          resolved,
          sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
          input: { ...input, skillType } as unknown as Record<string, unknown>,
          output: output as unknown as Record<string, unknown>,
          toolName: input.tool,
          scriptArg: skillType || input.tool,
        });
      }
    },

    [EventType.SHELL_ENV]: async (
      input: { cwd: string; sessionID?: string; callID?: string },
      output: { env: Record<string, string> }
    ) => {
      const resolved = resolveEventConfig(EventType.SHELL_ENV);

      await executeHook({
        ctx,
        eventType: EventType.SHELL_ENV,
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
        toolName: EventType.SHELL_ENV,
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
      output: { message: Record<string, unknown>; parts: unknown[] }
    ) => {
      const resolved = resolveEventConfig(EventType.CHAT_MESSAGE);

      await executeHook({
        ctx,
        eventType: EventType.CHAT_MESSAGE,
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
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
      const resolved = resolveEventConfig(EventType.CHAT_PARAMS);

      await executeHook({
        ctx,
        eventType: EventType.CHAT_PARAMS,
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
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
      const resolved = resolveEventConfig(EventType.CHAT_HEADERS);

      await executeHook({
        ctx,
        eventType: EventType.CHAT_HEADERS,
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
      });
    },

    [EventType.PERMISSION_ASK]: async (
      input: { sessionID?: string; tool?: string; [key: string]: unknown },
      output: { status: 'ask' | 'deny' | 'allow' }
    ) => {
      const resolved = resolveEventConfig(EventType.PERMISSION_ASK);

      await executeHook({
        ctx,
        eventType: EventType.PERMISSION_ASK,
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
      });
    },

    [EventType.COMMAND_EXECUTE_BEFORE]: async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: unknown[] }
    ) => {
      const resolved = resolveEventConfig(EventType.COMMAND_EXECUTE_BEFORE);

      await executeHook({
        ctx,
        eventType: EventType.COMMAND_EXECUTE_BEFORE,
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
      });
    },

    [EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM]: async (
      input: Record<string, unknown>,
      output: { messages: unknown[] }
    ) => {
      const resolved = resolveEventConfig(
        EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM
      );

      await executeHook({
        ctx,
        eventType: EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM,
        resolved,
        sessionId: DEFAULT_SESSION_ID,
        input,
        output: output as unknown as Record<string, unknown>,
      });
    },

    [EventType.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM]: async (
      input: { sessionID?: string; model: Model },
      output: { system: string[] }
    ) => {
      const resolved = resolveEventConfig(
        EventType.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM
      );

      await executeHook({
        ctx,
        eventType: 'experimental.chat.system.transform',
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
      });
    },

    [EventType.EXPERIMENTAL_SESSION_COMPACTING]: async (
      input: { sessionID: string },
      output: { context: string[]; prompt?: string }
    ) => {
      const resolved = resolveEventConfig(
        EventType.EXPERIMENTAL_SESSION_COMPACTING
      );

      await executeHook({
        ctx,
        eventType: EventType.EXPERIMENTAL_SESSION_COMPACTING,
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
      });
    },

    [EventType.EXPERIMENTAL_TEXT_COMPLETE]: async (
      input: { sessionID: string; messageID: string; partID: string },
      output: { text: string }
    ) => {
      const resolved = resolveEventConfig(EventType.EXPERIMENTAL_TEXT_COMPLETE);

      await executeHook({
        ctx,
        eventType: EventType.EXPERIMENTAL_TEXT_COMPLETE,
        resolved,
        sessionId: input.sessionID ?? DEFAULT_SESSION_ID,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
      });
    },

    [EventType.TOOL_DEFINITION]: async (
      input: { toolID: string },
      output: { description: string; parameters: unknown }
    ) => {
      const resolved = resolveEventConfig(EventType.TOOL_DEFINITION);

      await executeHook({
        ctx,
        eventType: 'tool.definition',
        resolved,
        sessionId: DEFAULT_SESSION_ID,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
      });
    },

    config: async (input: Record<string, unknown>) => {
      await saveToFile({
        content: `[${new Date().toISOString()}] - Config hook triggered\n${JSON.stringify(input, null, 2)}\n\n`,
      });
    },

    auth: {
      provider: '',
      methods: [],
    } as AuthHook,

    tool: {} as Record<string, ToolDefinition>,
  };

  return hooks;
};
