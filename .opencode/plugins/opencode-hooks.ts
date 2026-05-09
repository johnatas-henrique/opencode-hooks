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
import { initGlobalToastQueue } from '.opencode/plugins/core/toast-queue';
import { handlers } from '.opencode/plugins/features/handlers';
import { showStartupToast } from '.opencode/plugins/features/messages/show-startup-toast';
import {
  resolveEventConfig,
  resolveToolConfig,
} from '.opencode/plugins/features/events/events';
import { addSubagentSession } from '.opencode/plugins/features/scripts/run-script-handler';
import { OpenCodeEvents } from '.opencode/plugins/types/core';
import { userConfig } from '.opencode/plugins/config/settings';
import { DEFAULTS } from '.opencode/plugins/core/constants';
import {
  initAuditLogging,
  getEventRecorder,
  getErrorRecorder,
} from '.opencode/plugins/features/audit/plugin-integration';
import { setOnUnknownEvent } from '.opencode/plugins/features/events/events';
import { createHookExecutor } from '.opencode/plugins/features/hooks/hook-executor';
import fs from 'fs';
import path from 'path';

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

let hasShownToast = false;

export const OpencodeHooks: Plugin = async (
  ctx: PluginInput
): Promise<Hooks> => {
  const { client } = ctx;

  initGlobalToastQueue(
    (toast) => {
      client.tui.showToast({
        body: {
          title: toast.title,
          message: toast.message,
          variant: toast.variant!,
          duration: toast.duration,
        },
      });
    },
    (dropped) => {
      const recorder = getErrorRecorder();
      if (recorder?.logError) {
        recorder.logError({
          message: `Toast dropped: ${dropped.title || '(no title)'}`,
          context: JSON.stringify(dropped),
        });
      }
    },
    userConfig.toastQueue.staggerMs,
    userConfig.toastQueue.maxSize
  );

  if (!hasShownToast) {
    hasShownToast = true;
    await showStartupToast();
  }

  if (!userConfig.enabled) {
    return {};
  }

  validateScriptsDirectory();

  await initAuditLogging(userConfig.audit);

  setOnUnknownEvent(async (input) => {
    const rec = getEventRecorder();
    if (rec) {
      await rec.logEvent('UNKNOWN_EVENT_IN_RESOLVE', input.context);
    }
  });

  const executor = createHookExecutor();

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

      await executor.execute({
        ctx,
        eventType: event.type,
        resolved,
        sessionId,
        input: eventInput,
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

      await executor.execute({
        ctx,
        eventType: 'tool.execute.before',
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,
        toolName: input.tool,
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

        await executor.execute({
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

        await executor.execute({
          ctx,
          eventType: 'tool.execute.after',
          resolved,
          sessionId: input.sessionID,
          input: { ...input, skillType },
          output: output,
          toolName: input.tool,
        });
      }
    },

    [OpenCodeEvents.SHELL_ENV]: async (
      input: { cwd: string; sessionID?: string; callID?: string },
      output: { env: Record<string, string> }
    ) => {
      const resolved = resolveEventConfig(OpenCodeEvents.SHELL_ENV, input);

      await executor.execute({
        ctx,
        eventType: OpenCodeEvents.SHELL_ENV,
        resolved,
        sessionId: input.sessionID!,
        input: input,
        output: output,
        toolName: OpenCodeEvents.SHELL_ENV,
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

      await executor.execute({
        ctx,
        eventType: OpenCodeEvents.CHAT_MESSAGE,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,
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

      await executor.execute({
        ctx,
        eventType: OpenCodeEvents.CHAT_PARAMS,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,
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

      await executor.execute({
        ctx,
        eventType: OpenCodeEvents.CHAT_HEADERS,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,
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

      await executor.execute({
        ctx,
        eventType: OpenCodeEvents.PERMISSION_ASK,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,
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

      await executor.execute({
        ctx,
        eventType: OpenCodeEvents.COMMAND_EXECUTE_BEFORE,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,
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

      await executor.execute({
        ctx,
        eventType: OpenCodeEvents.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM,
        resolved,
        sessionId: DEFAULTS.core.defaultSessionId,
        input,
        output: output,
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

      await executor.execute({
        ctx,
        eventType: 'experimental.chat.system.transform',
        resolved,
        sessionId: input.sessionID ?? DEFAULTS.core.defaultSessionId,
        input: input,
        output: output,
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

      await executor.execute({
        ctx,
        eventType: OpenCodeEvents.EXPERIMENTAL_SESSION_COMPACTING,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,
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

      await executor.execute({
        ctx,
        eventType: OpenCodeEvents.EXPERIMENTAL_TEXT_COMPLETE,
        resolved,
        sessionId: input.sessionID,
        input: input,
        output: output,
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

      await executor.execute({
        ctx,
        eventType: 'tool.definition',
        resolved,
        sessionId: DEFAULTS.core.defaultSessionId,
        input: input,
        output: output,
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
