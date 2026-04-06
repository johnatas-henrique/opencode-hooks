import type { Plugin, PluginInput } from '@opencode-ai/plugin';
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
} from './helpers';
import { userConfig } from './helpers/user-events.config';
import {
  UNKNOWN_EVENT_LOG_FILE,
  DEFAULT_SESSION_ID,
} from './helpers/constants';

let hasShownToast = false;

export const OpencodeHooks: Plugin = async (ctx: PluginInput) => {
  const { client } = ctx;

  if (!userConfig.enabled) {
    return {
      event: async () => {},
      'tool.execute.before': async () => {},
      'tool.execute.after': async () => {},
      'shell.env': async () => {},
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
    content: `
    |=================================OpencodeHooks plugin initialized=================================|
    [${new Date().toISOString()}] - Configuration loaded from user-events.config.ts\n
    `,
  });

  if (!hasShownToast) {
    hasShownToast = true;
    await showStartupToast();
  }

  return {
    event: async ({ event }) => {
      const timestamp = new Date().toISOString();
      const isKnownEvent = !!handlers[event.type];
      if (!isKnownEvent) {
        await saveToFile({
          content: `===================UNKNOWN EVENT======================\n
          [${timestamp}] - [WARN] Event: ${event.type} is not configured.\n${JSON.stringify(event, null, 2)}\n\n`,
          showToast: useGlobalToastQueue().add,
          filename: UNKNOWN_EVENT_LOG_FILE,
        });
      }
      const resolved = resolveEventConfig(event.type);

      if (resolved.debug) {
        await handleDebugLog(timestamp, `DEBUG EVENT - ${event.type}`, event);
      }

      if (!resolved.enabled) {
        await saveToFile({
          content: `[${timestamp}] - Skipping disabled event: ${event.type}\n`,
          showToast: useGlobalToastQueue().add,
        });
        return;
      }

      await logEventConfig(timestamp, event.type, resolved);

      const handler = handlers[event.type];
      if (!handler) return;

      if (resolved.toast) {
        useGlobalToastQueue().add({
          title: resolved.toastTitle,
          message: (resolved.toastMessage ?? handler.buildMessage(event))
            .trim()
            .replace(/^\s+/gm, ''),
          variant: resolved.toastVariant,
          duration: resolved.toastDuration,
        });
      }

      for (const script of resolved.scripts) {
        const props = event.properties as Record<string, unknown>;
        const info = props?.info as Record<string, unknown> | undefined;
        const rawId = info?.id ?? props?.sessionID;
        const sessionId =
          typeof rawId === 'string' ? rawId : DEFAULT_SESSION_ID;

        await runScriptAndHandle({
          ctx,
          script,
          timestamp,
          eventType: event.type,
          resolved,
          sessionId,
        });
      }
    },

    async 'tool.execute.before'(
      input: ToolExecuteBeforeInput,
      _output: ToolExecuteBeforeOutput
    ) {
      const timestamp = new Date().toISOString();
      const resolved = resolveToolConfig('tool.execute.before', input.tool);
      await saveToFile({
        content: `
        |=================================Tool Execute After Hook Triggered=================================|\n
        [${timestamp}] - Tool: ${input.tool}
        Arguments: ${JSON.stringify(input)}\n
        Resolved Config: ${JSON.stringify(resolved, null, 2)}
        \n
        `,
      });

      if (resolved.debug) {
        await handleDebugLog(timestamp, 'DEBUG TOOL.BEFORE', {
          input,
          resolved,
        });
      }

      if (!resolved.enabled) return;

      if (resolved.toast) {
        const message = `Session Id: ${input.sessionID || DEFAULT_SESSION_ID}\nTool: ${input.tool}\nTime: ${new Date().toLocaleTimeString()}`;
        useGlobalToastQueue().add({
          title: resolved.toastTitle,
          message: (resolved.toastMessage ?? message)
            .trim()
            .replace(/^\s+/gm, ''),
          variant: resolved.toastVariant,
          duration: resolved.toastDuration,
        });
      }

      for (const script of resolved.scripts) {
        await runScriptAndHandle({
          ctx,
          script,
          scriptArg: input.tool,
          toolName: input.tool,
          timestamp,
          eventType: 'tool.execute.before',
          resolved,
          sessionId: input.sessionID || DEFAULT_SESSION_ID,
        });
      }
    },

    'tool.execute.after': async (
      input: ToolExecuteAfterInput,
      _output: ToolExecuteAfterOutput
    ) => {
      const timestamp = new Date().toISOString();
      const resolved = resolveToolConfig('tool.execute.after', input.tool);
      await saveToFile({
        content: `
        |=================================Tool Execute Before Hook Triggered=================================|\n
        [${timestamp}] - Tool: ${input.tool}
        Arguments: ${JSON.stringify(input)}\n
        Resolved Config: ${JSON.stringify(resolved, null, 2)}
        \n
        `,
      });
      if (resolved.debug) {
        await handleDebugLog(timestamp, 'DEBUG TOOL.AFTER', {
          input,
          _output,
          resolved,
        });
      }

      if (!resolved.enabled) return;

      if (input.tool === 'task') {
        const subagentType =
          typeof input.args.subagent_type === 'string'
            ? input.args.subagent_type
            : '';
        if (subagentType && resolved.toast) {
          const message = `Session Id: ${input.sessionID}\nAgent: ${subagentType}\nTime: ${new Date().toLocaleTimeString()}`;
          useGlobalToastQueue().add({
            title: resolved.toastTitle,
            message: (resolved.toastMessage ?? message)
              .trim()
              .replace(/^\s+/gm, ''),
            variant: resolved.toastVariant,
            duration: resolved.toastDuration,
          });
        }

        for (const script of resolved.scripts) {
          await runScriptAndHandle({
            ctx,
            script,
            scriptArg: subagentType,
            toolName: input.tool,
            timestamp,
            eventType: 'tool.execute.after',
            resolved,
            sessionId: input.sessionID,
          });
        }
      } else {
        for (const script of resolved.scripts) {
          await runScriptAndHandle({
            ctx,
            script,
            scriptArg: input.tool,
            toolName: input.tool,
            timestamp,
            eventType: 'tool.execute.after',
            resolved,
            sessionId: input.sessionID,
          });
        }
      }
    },

    'shell.env': async (_input: unknown, _output: unknown) => {
      const timestamp = new Date().toISOString();
      const resolved = resolveEventConfig('shell.env');

      if (!resolved.enabled) return;

      for (const script of resolved.scripts) {
        await runScriptAndHandle({
          ctx,
          script,
          toolName: 'shell.env',
          timestamp,
          eventType: 'shell.env',
          resolved,
          sessionId: DEFAULT_SESSION_ID,
        });
      }
    },
  };
};
