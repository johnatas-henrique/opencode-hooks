import type { Plugin, PluginInput } from '@opencode-ai/plugin';
import type {
  EventSessionCreated,
  EventSessionCompacted,
  EventSessionDeleted,
  EventSessionDiff,
  EventSessionError,
  EventSessionIdle,
  EventSessionUpdated,
  EventSessionStatus,
} from '@opencode-ai/sdk';
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

const isSessionCreated = (event: { type: string }): event is EventSessionCreated => 
  event.type === 'session.created';
const isSessionCompacted = (event: { type: string }): event is EventSessionCompacted => 
  event.type === 'session.compacted';
const isSessionDeleted = (event: { type: string }): event is EventSessionDeleted => 
  event.type === 'session.deleted';
const isSessionDiff = (event: { type: string }): event is EventSessionDiff => 
  event.type === 'session.diff';
const isSessionError = (event: { type: string }): event is EventSessionError => 
  event.type === 'session.error';
const isSessionIdle = (event: { type: string }): event is EventSessionIdle => 
  event.type === 'session.idle';
const isSessionStatus = (event: { type: string }): event is EventSessionStatus => 
  event.type === 'session.status';
const isSessionUpdated = (event: { type: string }): event is EventSessionUpdated => 
  event.type === 'session.updated';

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
          if (!isSessionCreated(event)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              '====SESSION CREATED====',
              `Session Id: ${event.properties.info.id}\nTime: ${formatTime()}`,
              'success',
              TOAST_DURATION.SHORT
            );
          }
          let output = '';
          if (eventConfig.script || eventConfig.appendToSession) {
            output = await runScript($, 'session-start.sh');
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
          if (!isSessionCompacted(event)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              '====SESSION COMPACTED====',
              `Session Id: ${event.properties.sessionID}\nTime: ${formatTime()}`,
              'info',
              TOAST_DURATION.SHORT
            );
          }
          let output = '';
          if (eventConfig.script || eventConfig.appendToSession) {
            output = await runScript($, 'pre-compact.sh');
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
            const output = await runScript($, 'session-stop.sh');
            if (config.saveToFile && output) {
              await saveToFile({ content: `[${timestamp}] ${output}\n` });
            }
          }
          break;
        }

        case 'session.deleted': {
          if (!isSessionDeleted(event)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              '====SESSION DELETED====',
              `Session Id: ${event.properties.info.id}\nTime: ${formatTime()}`,
              'error',
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case 'session.diff': {
          if (!isSessionDiff(event)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              '====SESSION DIFF====',
              `Session Id: ${event.properties.sessionID}\neventConfig: ${JSON.stringify(eventConfig)}\nTime: ${formatTime()}`,
              'warning',
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case 'session.error': {
          if (!isSessionError(event)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              '====SESSION ERROR====',
              `Session Id: ${event.properties.sessionID} || Error\nError: ${event.properties?.error?.name || 'Unknown error'}\nMessage: ${event.properties?.error?.data?.message || 'Unknown message'}\nTime: ${formatTime()}`,
              'error',
              TOAST_DURATION.LONG
            );
          }
          break;
        }

        case 'session.idle': {
          if (!isSessionIdle(event)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              '====IDLE SESSION====',
              `Session Id: ${event.properties.sessionID}\neventConfig: ${JSON.stringify(eventConfig)}\nTime: ${formatTime()}`,
              'info',
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case 'session.status': {
          if (!isSessionStatus(event)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              '====SESSION STATUS====',
              `Session Id: ${event.properties.sessionID}\neventConfig: ${JSON.stringify(eventConfig)}\nStatus: ${JSON.stringify(event.properties.status)}\nTime: ${formatTime()}`,
              'info',
              TOAST_DURATION.SHORT
            );
          }
          break;
        }

        case 'session.updated': {
          if (!isSessionUpdated(event)) break;
          if (eventConfig.toast) {
            createEventToast(
              toastQueue,
              '====UPDATED SESSION====',
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
              '====SUBAGENT CALLED====',
              `Session Id: ${input.sessionID}\nAgent: ${subagentType}\nTime: ${formatTime()}`,
              'info',
              TOAST_DURATION.SHORT
            );
          }
          if (toolConfig.script) {
            const output = await runScript($, 'log-agent.sh', subagentType);
            if (config.saveToFile && output) {
              await saveToFile({ content: `[${timestamp}] ${output}\n` });
            }
          }
        }
      }
    },
  };
};
