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

const TOAST_VARIANTS = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
} as const;

const EVENT_TYPES = {
  CREATED: 'session.created',
  COMPACTED: 'session.compacted',
  DELETED: 'session.deleted',
  DIFF: 'session.diff',
  ERROR: 'session.error',
  IDLE: 'session.idle',
  STATUS: 'session.status',
  UPDATED: 'session.updated',
  DISPOSED: 'server.instance.disposed',
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
        variant: toast.variant ?? TOAST_VARIANTS.INFO,
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
        case EVENT_TYPES.CREATED: {
          if (!isSessionEvent(event, EVENT_TYPES.CREATED)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.CREATED,
              `Session Id: ${event.properties.info.id}\nTime: ${formatTime()}`,
TOAST_VARIANTS.SUCCESS,
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

        case EVENT_TYPES.COMPACTED: {
          if (!isSessionEvent(event, EVENT_TYPES.COMPACTED)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.COMPACTED,
              `Session Id: ${event.properties.sessionID}\nTime: ${formatTime()}`,
              TOAST_VARIANTS.INFO,
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

        case EVENT_TYPES.DELETED: {
          if (!isSessionEvent(event, EVENT_TYPES.DELETED)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.DELETED,
              `Session Id: ${event.properties.info.id}\nTime: ${formatTime()}`,
              TOAST_VARIANTS.ERROR,
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case EVENT_TYPES.DIFF: {
          if (!isSessionEvent(event, EVENT_TYPES.DIFF)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.DIFF,
              `Session Id: ${event.properties.sessionID}\neventConfig: ${JSON.stringify(eventConfig)}\nTime: ${formatTime()}`,
TOAST_VARIANTS.WARNING,
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case EVENT_TYPES.ERROR: {
          if (!isSessionEvent(event, EVENT_TYPES.ERROR)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.ERROR,
              `Session Id: ${event.properties.sessionID} || Error\nError: ${event.properties?.error?.name || 'Unknown error'}\nMessage: ${event.properties?.error?.data?.message || 'Unknown message'}\nTime: ${formatTime()}`,
              TOAST_VARIANTS.ERROR,
              TOAST_DURATION.LONG
            );
          }
          break;
        }

        case EVENT_TYPES.IDLE: {
          if (!isSessionEvent(event, EVENT_TYPES.IDLE)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.IDLE,
              `Session Id: ${event.properties.sessionID}\neventConfig: ${JSON.stringify(eventConfig)}\nTime: ${formatTime()}`,
              TOAST_VARIANTS.INFO,
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case EVENT_TYPES.STATUS: {
          if (!isSessionEvent(event, EVENT_TYPES.STATUS)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.STATUS,
              `Session Id: ${event.properties.sessionID}\neventConfig: ${JSON.stringify(eventConfig)}\nStatus: ${JSON.stringify(event.properties.status)}\nTime: ${formatTime()}`,
              TOAST_VARIANTS.INFO,
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case EVENT_TYPES.UPDATED: {
          if (!isSessionEvent(event, EVENT_TYPES.UPDATED)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              TOAST_TITLES.UPDATED,
              `Session Id: ${event.properties.info.id}\neventConfig: ${JSON.stringify(eventConfig)}\nTime: ${formatTime()}`,
              TOAST_VARIANTS.INFO,
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
              TOAST_VARIANTS.INFO,
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
