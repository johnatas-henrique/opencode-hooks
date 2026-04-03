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
  showActivePluginsToast,
  waitForToastSilence,
  countToastsInLog,
} from './helpers';
import { userConfig } from './helpers/user-events.config';
import { getLatestLogFile } from './helpers/plugin-status';

type ToastQueue = ReturnType<typeof getGlobalToastQueue>;

let hasShownToast = false;
let wasOverwritten = false;
let fallbackShown = false;
let ourToastCount = 0;

const isSubagentSession = (title: string): boolean =>
  title.startsWith('Task:') || title.startsWith('Agent:');

const runScriptAndHandle = async (
  $: PluginInput['$'],
  script: string,
  arg: string,
  timestamp: string,
  toastQueue: ToastQueue
) => {
  try {
    const output = await runScript($, script, arg);
    if (output) {
      await saveToFile({ content: `[${timestamp}] ${output}\n` });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await saveToFile({
      content: `[${timestamp}] - Script error: ${script} - ${errorMessage}\n`,
    });
    toastQueue.add({
      title: '====SCRIPT ERROR====',
      message: `Script: ${script}\nError: ${errorMessage}\nCheck user-events.config.ts`,
      variant: 'error',
      duration: 5000,
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

  if (!hasShownToast && process.env.NODE_ENV !== 'test') {
    hasShownToast = true;
    const logFile = getLatestLogFile();

    toastQueue.add({
      title: 'Loading plugin status...',
      message: 'Scanning OpenCode plugins',
      variant: 'info',
      duration: 3000,
    });

    if (logFile) {
      const { promise, cleanup } = waitForToastSilence(logFile);
      let timeoutTimer: ReturnType<typeof setTimeout>;
      const timeout = new Promise<void>((resolve) => {
        timeoutTimer = setTimeout(resolve, 5000);
      });

      Promise.race([promise, timeout]).then(async () => {
        clearTimeout(timeoutTimer!);
        cleanup();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          await showActivePluginsToast(toastQueue, { duration: 15000 });
          ourToastCount = countToastsInLog(logFile);

          setTimeout(() => {
            const newCount = countToastsInLog(logFile);
            if (newCount > ourToastCount) {
              wasOverwritten = true;
            }
          }, 3000);
        } catch {
          // Silent fail - startup toast should not break plugin
        }
      });
    }
  }

  return {
    event: async ({ event }) => {
      if (
        event.type === 'session.created' &&
        wasOverwritten &&
        !fallbackShown
      ) {
        const props = event.properties as Record<string, unknown>;
        const info = props?.info as Record<string, unknown> | undefined;
        const title = typeof info?.title === 'string' ? info.title : '';

        if (!isSubagentSession(title)) {
          fallbackShown = true;
          await showActivePluginsToast(toastQueue, { duration: 15000 });
        }
      }

      const timestamp = new Date().toISOString();
      const resolved = resolveEventConfig(event.type);

      if (!resolved.enabled) {
        await saveToFile({
          content: `[${timestamp}] - Skipping disabled event: ${event.type}\n`,
        });
        return;
      }

      if (userConfig.saveToFile && !event.type.startsWith('message.')) {
        await saveToFile({
          content: `[${timestamp}] - ${event.type} - ${JSON.stringify(resolved)}\n`,
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

      for (const script of resolved.scripts) {
        try {
          const output = await runScript($, script);
          if (resolved.saveToFile && output) {
            await saveToFile({ content: `[${timestamp}] ${output}\n` });
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
          });
          toastQueue.add({
            title: '====SCRIPT ERROR====',
            message: `Script: ${script}\nError: ${errorMessage}\nCheck user-events.config.ts`,
            variant: 'error',
            duration: 5000,
          });
        }
      }
    },

    'tool.execute.before': async (
      input: ToolExecuteBeforeInput,
      _output: ToolExecuteBeforeOutput
    ) => {
      const timestamp = new Date().toISOString();
      const resolved = resolveToolConfig('tool.execute.before', input.tool);

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
        await runScriptAndHandle($, script, input.tool, timestamp, toastQueue);
      }
    },

    'tool.execute.after': async (
      input: ToolExecuteAfterInput,
      _output: ToolExecuteAfterOutput
    ) => {
      const timestamp = new Date().toISOString();
      const resolved = resolveToolConfig('tool.execute.after', input.tool);

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
            toastQueue
          );
        }
      } else {
        for (const script of resolved.scripts) {
          await runScriptAndHandle(
            $,
            script,
            input.tool,
            timestamp,
            toastQueue
          );
        }
      }
    },

    'shell.env': async (_input: unknown, _output: unknown) => {
      const timestamp = new Date().toISOString();
      const resolved = resolveEventConfig('shell.env');

      if (!resolved.enabled) return;

      for (const script of resolved.scripts) {
        await runScriptAndHandle($, script, '', timestamp, toastQueue);
      }
    },
  };
};
