import type { Plugin, PluginInput } from '@opencode-ai/plugin';
import {
  ToolExecuteAfterInput,
  ToolExecuteAfterOutput,
} from './types/opencode-hooks';
import {
  appendToSession,
  getGlobalToastQueue,
  runScript,
  saveToFile,
  loadEventsConfig,
  getEventConfig,
} from './helpers';
import { TOAST_DURATION } from './helpers/constants';

type ToastVariant = 'success' | 'warning' | 'error' | 'info';

const createEventToast = (
  queue: ReturnType<typeof getGlobalToastQueue>,
  title: string,
  message: string,
  variant: ToastVariant,
  duration: number = TOAST_DURATION.SHORT
) => {
  queue.add({
    title,
    message: message.trim().replace(/^\s+/gm, ''),
    variant,
    duration,
  });
};

const formatTime = (): string => new Date().toLocaleTimeString();

const isSessionEvent = <T extends { type: string }>(
  event: T,
  eventType: string
): boolean => event.type === eventType;

const SCRIPTS = {
  CREATED: 'session-start.sh',
  COMPACTED: 'pre-compact.sh',
  DISPOSED: 'session-stop.sh',
  AGENT: 'log-agent.sh',
} as const;

const TOAST_TITLES = {
  CREATED: '====SESSION CREATED====',
  COMPACTED: '====SESSION COMPACTED====',
  DELETED: '====SESSION DELETED====',
  DIFF: '====SESSION DIFF====',
  ERROR: '====SESSION ERROR====',
  IDLE: '====IDLE SESSION====',
  STATUS: '====SESSION STATUS====',
  UPDATED: '====UPDATED SESSION====',
  SUBAGENT: '====SUBAGENT CALLED====',
} as const;

export const OpencodeHooks: Plugin = async (ctx: PluginInput) => {
  const { client, $ } = ctx;

  const config = await loadEventsConfig();

  if (!config.enabled) {
    return {
      event: async () => {},
      'tool.execute.after': async () => {},
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
  const initTimestamp = new Date().toISOString();
  await saveToFile({
    content: `
    |=================================OpencodeHooks plugin initialized=================================|\n
    [${initTimestamp}] - Configuration: ${JSON.stringify(config)}\n
    `,
  });
  return {
    event: async ({ event }) => {
      const timestamp = new Date().toISOString();
      const eventConfig = getEventConfig(event.type);
      if (eventConfig.enabled === false) {
        await saveToFile({
          content: `[${timestamp}] - Skipping disabled event: ${event.type}\n`,
        });
        return;
      }

      if (config.saveToFile && !event.type.includes('message')) {
        await saveToFile({
          content: `[${timestamp}] - ${event.type} - ${JSON.stringify(eventConfig)}\n`,
        });
      }

      switch (event.type) {
        case 'session.created': {
          if (!isSessionEvent(event, 'session.created')) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.CREATED,
              `Session Id: ${event.properties.info.id}\nTime: ${formatTime()}`,
              'success',
              TOAST_DURATION.SHORT
            );
          }
          let output = '';
          if (eventConfig.script || eventConfig.appendToSession) {
            output = await runScript($, SCRIPTS.CREATED);
          }
          if (config.saveToFile && output) {
            await saveToFile({ content: `[${timestamp}] ${output}\n` });
          }
          if (eventConfig.appendToSession && output) {
            await appendToSession(ctx, event.properties.info.id, output);
          }
          break;
        }

        case 'session.compacted': {
          if (!isSessionEvent(event, 'session.compacted')) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.COMPACTED,
              `Session Id: ${event.properties.sessionID}\nTime: ${formatTime()}`,
              'info',
              TOAST_DURATION.SHORT
            );
          }
          let output = '';
          if (eventConfig.script || eventConfig.appendToSession) {
            output = await runScript($, SCRIPTS.COMPACTED);
          }
          if (config.saveToFile && output) {
            await saveToFile({ content: `[${timestamp}] ${output}\n` });
          }
          if (eventConfig.appendToSession && output) {
            await appendToSession(
              ctx,
              event.properties.sessionID,
              output
            );
          }
          break;
        }

        case 'server.instance.disposed': {
          if (eventConfig.script) {
            const output = await runScript($, SCRIPTS.DISPOSED);
            if (config.saveToFile && output) {
              await saveToFile({ content: `[${timestamp}] ${output}\n` });
            }
          }
          break;
        }

        case 'session.deleted': {
          if (!isSessionEvent(event, 'session.deleted')) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.DELETED,
              `Session Id: ${event.properties.info.id}\nTime: ${formatTime()}`,
              'error',
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case 'session.diff': {
          if (!isSessionEvent(event, 'session.diff')) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.DIFF,
              `Session Id: ${event.properties.sessionID}\neventConfig: ${JSON.stringify(eventConfig)}\nTime: ${formatTime()}`,
              'warning',
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case 'session.error': {
          if (!isSessionEvent(event, 'session.error')) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.ERROR,
              `Session Id: ${event.properties.sessionID} || Error\nError: ${event.properties?.error?.name || 'Unknown error'}\nMessage: ${event.properties?.error?.data?.message || 'Unknown message'}\nTime: ${formatTime()}`,
              'error',
              TOAST_DURATION.LONG
            );
          }
          break;
        }

        case 'session.idle': {
          if (!isSessionEvent(event, 'session.idle')) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.IDLE,
              `Session Id: ${event.properties.sessionID}\neventConfig: ${JSON.stringify(eventConfig)}\nTime: ${formatTime()}`,
              'info',
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case 'session.status': {
          if (!isSessionEvent(event, 'session.status')) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.STATUS,
              `Session Id: ${event.properties.sessionID}\neventConfig: ${JSON.stringify(eventConfig)}\nStatus: ${JSON.stringify(event.properties.status)}\nTime: ${formatTime()}`,
              'info',
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case 'session.updated': {
          if (!isSessionEvent(event, 'session.updated')) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.UPDATED,
              `Session Id: ${event.properties.info.id}\neventConfig: ${JSON.stringify(eventConfig)}\nTime: ${formatTime()}`,
              'info',
              TOAST_DURATION.SHORT
            );
          }
          break;
        }
      }
    },

    'tool.execute.after': async (
      input: ToolExecuteAfterInput,
      _output: ToolExecuteAfterOutput
    ) => {
      const timestamp = new Date().toISOString();
      const toolConfig = getEventConfig(`tool.execute.${input.tool}`);

      if (toolConfig.enabled === false) {
        return;
      }

      if (input.tool === 'task') {
        const subagentType = input.args.subagent_type as string;
        if (subagentType) {
          if (toolConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.SUBAGENT,
              `Session Id: ${input.sessionID}\nAgent: ${subagentType}\nTime: ${formatTime()}`,
              'info',
              TOAST_DURATION.SHORT
            );
          }
          if (toolConfig.script) {
            const output = await runScript($, SCRIPTS.AGENT, subagentType);
            if (config.saveToFile && output) {
              await saveToFile({ content: `[${timestamp}] ${output}\n` });
            }
          }
        }
      }
    },
  };
};
