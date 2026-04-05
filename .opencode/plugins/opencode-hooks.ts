import type { Plugin, PluginInput } from '@opencode-ai/plugin';
import {
  ToolExecuteAfterInput,
  ToolExecuteAfterOutput,
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from './types/opencode-hooks';
import {
  appendToSession,
  getGlobalToastQueue,
  runScript,
  saveToFile,
  handlers,
  resolveEventConfig,
  resolveToolConfig,
  showStartupToast,
} from './helpers';
import {
  DEBUG_LOG_FILE,
  RUN_ONCE_TTL_HOURS,
  TOAST_DURATION,
} from './helpers/constants';
import { userConfig } from './helpers/user-events.config';

type ToastQueue = ReturnType<typeof getGlobalToastQueue>;

let hasShownToast = false;
type RunOnceEntry = { value: boolean; timestamp: number };
const runOnlyOnceTracker = new Map<string, RunOnceEntry>();

const getRunOnce = (eventType: string): boolean => {
  const entry = runOnlyOnceTracker.get(eventType);
  if (!entry) return false;
  const ttlMs = RUN_ONCE_TTL_HOURS * 60 * 60 * 1000;
  if (Date.now() - entry.timestamp > ttlMs) {
    runOnlyOnceTracker.delete(eventType);
    return false;
  }
  return entry.value;
};

const setRunOnce = (eventType: string) => {
  runOnlyOnceTracker.set(eventType, { value: true, timestamp: Date.now() });
};

const formatEventInfo = (eventType: string, toolName?: string): string => {
  if (eventType.startsWith('tool.execute.') && toolName) {
    return toolName;
  }
  return eventType;
};

const runScriptAndHandle = async (
  $: PluginInput['$'],
  script: string,
  arg: string,
  timestamp: string,
  toastQueue: ToastQueue,
  eventType: string,
  toolName?: string
) => {
  try {
    const output = await runScript($, script, arg);
    if (output) {
      await saveToFile({
        content: `[${timestamp}] ${output}\n`,
        showToast: toastQueue.add,
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const eventInfo = formatEventInfo(eventType, toolName);
    await saveToFile({
      content: `[${timestamp}] - Script error: ${eventInfo} - ${script} - ${errorMessage}\n`,
      showToast: toastQueue.add,
    });
    toastQueue.add({
      title: '====SCRIPT ERROR====',
      message: `Event: ${eventInfo}\nScript: ${script}\nError: ${errorMessage}\nCheck user-events.config.ts`,
      variant: 'error',
      duration: TOAST_DURATION.TEN_SECONDS,
    });
  }
};

export const OpencodeHooks: Plugin = async (ctx: PluginInput) => {
  const { client, $ } = ctx;

  if (!userConfig.enabled) {
    return {
      event: async () => {},
      'tool.execute.before': async () => {},
      'tool.execute.after': async () => {},
      'shell.env': async () => {},
    };
  }

  const toastQueue = getGlobalToastQueue((toast) => {
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
    await showStartupToast(toastQueue);
  }

  return {
    event: async ({ event }) => {
      const timestamp = new Date().toISOString();
      const resolved = resolveEventConfig(event.type);

      if (resolved.debug) {
        const debugMessage = JSON.stringify(event, null, 2);
        toastQueue.add({
          title: `====DEBUG EVENT - ${event.type}====`,
          message: debugMessage,
          variant: 'info',
          duration: TOAST_DURATION.TEN_SECONDS,
        });
        await saveToFile({
          content: `[${timestamp}] - ${event.type}\n${debugMessage}\n`,
          filename: DEBUG_LOG_FILE,
          showToast: toastQueue.add,
        });
      }

      if (!resolved.enabled) {
        await saveToFile({
          content: `[${timestamp}] - Skipping disabled event: ${event.type}\n`,
          showToast: toastQueue.add,
        });
        return;
      }

      if (resolved.saveToFile && !event.type.startsWith('message.')) {
        await saveToFile({
          content: `[${timestamp}] - ${event.type} - ${JSON.stringify(resolved)}\n`,
          showToast: toastQueue.add,
        });
      }

      const handler = handlers[event.type];
      if (!handler) return;

      if (resolved.toast) {
        toastQueue.add({
          title: resolved.toastTitle,
          message: (resolved.toastMessage ?? handler.buildMessage(event))
            .trim()
            .replace(/^\s+/gm, ''),
          variant: resolved.toastVariant,
          duration: resolved.toastDuration,
        });
      }

      if (resolved.runOnlyOnce && getRunOnce(event.type)) {
        return;
      }

      for (const script of resolved.scripts) {
        try {
          const output = await runScript($, script);
          if (resolved.saveToFile && output) {
            await saveToFile({
              content: `[${timestamp}] ${output}\n`,
              showToast: toastQueue.add,
            });
          }
          if (resolved.appendToSession && output) {
            const props = event.properties as Record<string, unknown>;
            const info = props?.info as Record<string, unknown> | undefined;
            const rawId = info?.id ?? props?.sessionID;
            const sessionId = typeof rawId === 'string' ? rawId : 'unknown';
            await appendToSession(ctx, sessionId, output);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          await saveToFile({
            content: `[${timestamp}] - Script error: ${script} - ${errorMessage}\n`,
            showToast: toastQueue.add,
          });
          toastQueue.add({
            title: '====SCRIPT ERROR====',
            message: `Script: ${script}\nError: ${errorMessage}\nCheck user-events.config.ts`,
            variant: 'error',
            duration: TOAST_DURATION.FIVE_SECONDS,
          });
        }
      }

      if (resolved.runOnlyOnce && resolved.scripts.length > 0) {
        setRunOnce(event.type);
      }
    },

    'tool.execute.before': async (
      input: ToolExecuteBeforeInput,
      _output: ToolExecuteBeforeOutput
    ) => {
      const timestamp = new Date().toISOString();
      const resolved = resolveToolConfig('tool.execute.before', input.tool);

      if (resolved.debug) {
        const debugMessage = JSON.stringify({ input, resolved }, null, 2);
        toastQueue.add({
          title: 'DEBUG TOOL.BEFORE',
          message: debugMessage,
          variant: 'info',
          duration: TOAST_DURATION.TEN_SECONDS,
        });
        await saveToFile({
          content: `[${timestamp}] - tool.execute.before - ${input.tool}\n${debugMessage}\n`,
          filename: DEBUG_LOG_FILE,
          showToast: toastQueue.add,
        });
      }

      if (!resolved.enabled) return;

      if (resolved.toast) {
        const message = `Session Id: ${input.sessionID || 'unknown'}\nTool: ${input.tool}\nTime: ${new Date().toLocaleTimeString()}`;
        toastQueue.add({
          title: resolved.toastTitle,
          message: (resolved.toastMessage ?? message)
            .trim()
            .replace(/^\s+/gm, ''),
          variant: resolved.toastVariant,
          duration: resolved.toastDuration,
        });
      }

      for (const script of resolved.scripts) {
        await runScriptAndHandle(
          $,
          script,
          input.tool,
          timestamp,
          toastQueue,
          'tool.execute.before',
          input.tool
        );
      }
    },

    'tool.execute.after': async (
      input: ToolExecuteAfterInput,
      _output: ToolExecuteAfterOutput
    ) => {
      const timestamp = new Date().toISOString();
      const resolved = resolveToolConfig('tool.execute.after', input.tool);

      if (resolved.debug) {
        const debugMessage = JSON.stringify(
          { input, _output, resolved },
          null,
          2
        );
        toastQueue.add({
          title: 'DEBUG TOOL.AFTER',
          message: debugMessage,
          variant: 'info',
          duration: TOAST_DURATION.TEN_SECONDS,
        });
        await saveToFile({
          content: `[${timestamp}] - tool.execute.after - ${input.tool}\n${debugMessage}\n`,
          filename: DEBUG_LOG_FILE,
          showToast: toastQueue.add,
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
          toastQueue.add({
            title: resolved.toastTitle,
            message: (resolved.toastMessage ?? message)
              .trim()
              .replace(/^\s+/gm, ''),
            variant: resolved.toastVariant,
            duration: resolved.toastDuration,
          });
        }

        for (const script of resolved.scripts) {
          await runScriptAndHandle(
            $,
            script,
            subagentType,
            timestamp,
            toastQueue,
            'tool.execute.after',
            input.tool
          );
        }
      } else {
        for (const script of resolved.scripts) {
          await runScriptAndHandle(
            $,
            script,
            input.tool,
            timestamp,
            toastQueue,
            'tool.execute.after',
            input.tool
          );
        }
      }
    },

    'shell.env': async (_input: unknown, _output: unknown) => {
      const timestamp = new Date().toISOString();
      const resolved = resolveEventConfig('shell.env');

      if (!resolved.enabled) return;

      for (const script of resolved.scripts) {
        await runScriptAndHandle(
          $,
          script,
          '',
          timestamp,
          toastQueue,
          'shell.env'
        );
      }
    },
  };
};
