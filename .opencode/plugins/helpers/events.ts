import { handlers } from './handlers';
import { userConfig } from './user-events.config';
import type { ResolvedEventConfig } from './event-types';

export { ResolvedEventConfig };
export function getHandler(eventType: string) {
  return handlers[eventType];
}

export function resolveEventConfig(eventType: string): ResolvedEventConfig {
  const handler = handlers[eventType];
  const userEventConfig = (userConfig as any).events[eventType];
  const global = userConfig;

  if (!global.enabled) {
    return { enabled: false } as ResolvedEventConfig;
  }

  if (userEventConfig === undefined) {
    return {
      enabled: true,
      toast: global.toast,
      toastTitle: handler?.title ?? '',
      toastMessage: undefined,
      toastVariant: handler?.variant ?? 'info',
      toastDuration: handler?.duration ?? 2000,
      scripts: global.runScripts
        ? [handler?.defaultScript ?? `${eventType.replace(/\./g, '-')}.sh`]
        : [],
      saveToFile: global.saveToFile,
      appendToSession: global.appendToSession,
    };
  }

  if (userEventConfig === false) {
    return { enabled: false } as ResolvedEventConfig;
  }

  const cfg = userEventConfig as any;

  let scripts: string[] = [];
  if (cfg.runScripts === false) {
    scripts = [];
  } else if (cfg.scripts !== undefined) {
    scripts = cfg.scripts;
  } else if (cfg.runScripts === true || global.runScripts) {
    scripts = [handler?.defaultScript ?? `${eventType.replace(/\./g, '-')}.sh`];
  }

  const toastCfg = typeof cfg.toast === 'object' ? cfg.toast : null;

  return {
    enabled: true,
    toast:
      cfg.toast !== undefined
        ? typeof cfg.toast === 'boolean'
          ? cfg.toast
          : true
        : global.toast,
    toastTitle: toastCfg?.title ?? handler?.title ?? '',
    toastMessage: toastCfg?.message,
    toastVariant: toastCfg?.variant ?? handler?.variant ?? 'info',
    toastDuration: toastCfg?.duration ?? handler?.duration ?? 2000,
    scripts,
    saveToFile: cfg.saveToFile ?? global.saveToFile,
    appendToSession: cfg.appendToSession ?? global.appendToSession,
  };
}

export function resolveToolConfig(
  toolEventType: string,
  toolName: string
): ResolvedEventConfig {
  const toolConfigs = (userConfig as any).tools?.[toolEventType];
  const toolConfig = toolConfigs?.[toolName];

  if (toolConfig === false) {
    return { enabled: false } as ResolvedEventConfig;
  }

  if (!toolConfig) {
    return resolveEventConfig(toolEventType);
  }

  const handler = handlers[toolEventType];
  const global = userConfig;

  const cfg = toolConfig as any;

  let scripts: string[] = [];
  if (cfg.runScripts === false) {
    scripts = [];
  } else if (cfg.scripts !== undefined) {
    scripts = cfg.scripts;
  } else if (cfg.runScripts === true || global.runScripts) {
    scripts = [
      handler?.defaultScript ?? `${toolEventType.replace(/\./g, '-')}.sh`,
    ];
  }

  const toastCfg = typeof cfg.toast === 'object' ? cfg.toast : null;

  return {
    enabled: true,
    toast:
      cfg.toast !== undefined
        ? typeof cfg.toast === 'boolean'
          ? cfg.toast
          : true
        : global.toast,
    toastTitle: toastCfg?.title ?? handler?.title ?? '',
    toastMessage: toastCfg?.message,
    toastVariant: toastCfg?.variant ?? handler?.variant ?? 'info',
    toastDuration: toastCfg?.duration ?? handler?.duration ?? 2000,
    scripts,
    saveToFile: cfg.saveToFile ?? global.saveToFile,
    appendToSession: cfg.appendToSession ?? global.appendToSession,
  };
}
