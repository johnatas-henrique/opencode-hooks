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
  type ToastConfig,
  type ToastVariant,
} from './helpers';
import { TOAST_DURATION } from './helpers/constants';

const DEFAULT_SCRIPTS = {
  CREATED: 'session-start.sh',
  COMPACTED: 'pre-compact.sh',
  DISPOSED: 'session-stop.sh',
  AGENT: 'log-agent.sh',
} as const;

const formatTime = (): string => new Date().toLocaleTimeString();

const isSessionEvent = <T extends { type: string }>(
  event: T,
  eventType: string
): boolean => event.type === eventType;

const createEventToast = (
  queue: ReturnType<typeof getGlobalToastQueue>,
  config: ToastConfig | undefined,
  defaultTitle: string,
  defaultVariant: ToastVariant,
  defaultDuration: number,
  message: string
) => {
  const toastConfig = typeof config === 'boolean' ? undefined : config;
  queue.add({
    title: toastConfig?.title ?? defaultTitle,
    message: message.trim().replace(/^\s+/gm, ''),
    variant: toastConfig?.variant ?? defaultVariant,
    duration: toastConfig?.duration ?? defaultDuration,
  });
};

type EventHandlerFactory = (
  event: any,
  ctx: any,
  toastQueue: any,
  eventConfig: ReturnType<typeof getEventConfig>,
  globalConfig: any,
  timestamp: string,
  run$: PluginInput["$"]
) => Promise<void> | void;

const createEventHandler = (
  getSessionId: (event: any) => string,
  defaultTitle: string,
  defaultVariant: ToastVariant,
  defaultDuration: number,
  fallbackScript?: string
): EventHandlerFactory => {
  return async (event, ctx, toastQueue, eventConfig, globalConfig, timestamp, run$) => {
    const toastCfg = eventConfig.toast as ToastConfig | undefined;
    const message = `Session Id: ${getSessionId(event)}\nTime: ${formatTime()}`;
    
    if (eventConfig.toast !== false) {
      createEventToast(
        toastQueue,
        toastCfg,
        defaultTitle,
        defaultVariant,
        defaultDuration,
        message
      );
    }

    const scriptConfig = eventConfig.script;
    let scriptName: string | undefined;
    
    if (typeof scriptConfig === 'string') {
      scriptName = scriptConfig;
    } else if (scriptConfig === true && fallbackScript) {
      scriptName = fallbackScript;
    } else if (scriptConfig === true && globalConfig.script && fallbackScript) {
      scriptName = fallbackScript;
    }
    
    if (scriptName) {
      try {
        const output = await runScript(run$, scriptName);
        
        if (globalConfig.saveToFile && output) {
          await saveToFile({ content: `[${timestamp}] ${output}\n` });
        }
        
        if (eventConfig.appendToSession && output) {
          await appendToSession(ctx, getSessionId(event), output);
        }
      } catch (err) {
        console.error(`Script ${scriptName} failed:`, err);
      }
    }
  };
};

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

  await saveToFile({
    content: `
    |=================================OpencodeHooks plugin initialized=================================|
    [${new Date().toISOString()}] - Configuration: ${JSON.stringify(config)}\n
    `,
  });

  const eventHandlers: Record<string, EventHandlerFactory> = {
    'session.created': createEventHandler(
      (e) => e.properties.info.id,
      '====SESSION CREATED====',
      'success',
      TOAST_DURATION.SHORT,
      DEFAULT_SCRIPTS.CREATED
    ),
    'session.compacted': createEventHandler(
      (e) => e.properties.sessionID,
      '====SESSION COMPACTED====',
      'info',
      TOAST_DURATION.SHORT,
      DEFAULT_SCRIPTS.COMPACTED
    ),
    'session.deleted': createEventHandler(
      (e) => e.properties.info.id,
      '====SESSION DELETED====',
      'error',
      TOAST_DURATION.SHORT
    ),
    'session.error': createEventHandler(
      (e) => e.properties.sessionID,
      '====SESSION ERROR====',
      'error',
      TOAST_DURATION.LONG
    ),
    'session.diff': createEventHandler(
      (e) => e.properties.sessionID,
      '====SESSION DIFF====',
      'warning',
      TOAST_DURATION.SHORT
    ),
    'session.idle': createEventHandler(
      (e) => e.properties.sessionID,
      '====IDLE SESSION====',
      'info',
      TOAST_DURATION.SHORT
    ),
    'session.status': createEventHandler(
      (e) => e.properties.sessionID,
      '====SESSION STATUS====',
      'info',
      TOAST_DURATION.SHORT
    ),
    'session.updated': createEventHandler(
      (e) => e.properties.info.id,
      '====UPDATED SESSION====',
      'info',
      TOAST_DURATION.SHORT
    ),
    'server.instance.disposed': createEventHandler(
      (e) => e.properties.directory || 'unknown',
      '',
      'info',
      0,
      DEFAULT_SCRIPTS.DISPOSED
    ),
  };

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

      const handler = eventHandlers[event.type];
      if (handler) {
        await handler(event, ctx, toastQueue, eventConfig, config, timestamp, $);
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
          const toastCfg = toolConfig.toast as ToastConfig | undefined;
          if (toolConfig.toast !== false) {
            createEventToast(
              toastQueue,
              toastCfg,
              '====SUBAGENT CALLED====',
              'info',
              TOAST_DURATION.SHORT,
              `Session Id: ${input.sessionID}\nAgent: ${subagentType}\nTime: ${formatTime()}`
            );
          }

          const scriptName = typeof toolConfig.script === 'string'
            ? toolConfig.script
            : undefined;
          
          if (scriptName) {
            try {
              const output = await runScript($, scriptName, subagentType);
              if (config.saveToFile && output) {
                await saveToFile({ content: `[${timestamp}] ${output}\n` });
              }
            } catch (err) {
              console.error(`Script ${scriptName} failed:`, err);
            }
          }
        }
      }
    },
  };
};