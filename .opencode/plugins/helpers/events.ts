import { handlers, type EventHandler } from './handlers';
import { userConfig } from './user-events.config';
import type {
  ResolvedEventConfig,
  EventConfig,
  ToolConfig,
  ToastOverride,
} from './event-types';

export { ResolvedEventConfig };

const DISABLED_CONFIG: ResolvedEventConfig = {
  enabled: false,
  toast: false,
  toastTitle: '',
  toastMessage: undefined,
  toastVariant: 'info',
  toastDuration: 0,
  scripts: [],
  saveToFile: false,
  appendToSession: false,
  runOnce: false,
};

export function getHandler(eventType: string): EventHandler | undefined {
  return handlers[eventType];
}

function getDefaultScript(eventType: string): string {
  return `${eventType.replace(/\./g, '-')}.sh`;
}

function resolveScripts(
  cfg: EventConfig,
  handlerDefaultScript: string,
  globalRunScripts: boolean
): string[] {
  if (typeof cfg === 'object' && cfg !== null) {
    if (cfg.runScripts === false) {
      return [];
    }
    if (cfg.scripts !== undefined) {
      return cfg.scripts;
    }
    if (cfg.runScripts === true || globalRunScripts) {
      return [handlerDefaultScript];
    }
    return [];
  }
  if (cfg === true) {
    return globalRunScripts ? [handlerDefaultScript] : [];
  }
  return [];
}

function resolveToast(cfg: EventConfig, globalToast: boolean): boolean {
  if (typeof cfg === 'object' && cfg !== null) {
    if (cfg.toast === undefined) {
      return globalToast;
    }
    if (typeof cfg.toast === 'boolean') {
      return cfg.toast;
    }
    return true;
  }
  return globalToast;
}

function resolveToastOverride(cfg: EventConfig): ToastOverride | null {
  if (
    typeof cfg === 'object' &&
    cfg !== null &&
    typeof cfg.toast === 'object' &&
    cfg.toast !== null
  ) {
    return cfg.toast;
  }
  return null;
}

export function resolveEventConfig(eventType: string): ResolvedEventConfig {
  const handler = handlers[eventType];
  const userEventConfig =
    userConfig.events[eventType as keyof typeof userConfig.events];
  const global = userConfig;

  if (!global.enabled) {
    return DISABLED_CONFIG;
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
        ? [handler?.defaultScript ?? getDefaultScript(eventType)]
        : [],
      saveToFile: global.saveToFile,
      appendToSession: global.appendToSession,
      runOnce: false,
    };
  }

  if (userEventConfig === false) {
    return DISABLED_CONFIG;
  }

  const scripts = resolveScripts(
    userEventConfig,
    handler?.defaultScript ?? getDefaultScript(eventType),
    global.runScripts
  );
  const toastCfg = resolveToastOverride(userEventConfig);

  return {
    enabled: true,
    toast: resolveToast(userEventConfig, global.toast),
    toastTitle: toastCfg?.title ?? handler?.title ?? '',
    toastMessage: toastCfg?.message,
    toastVariant: toastCfg?.variant ?? handler?.variant ?? 'info',
    toastDuration: toastCfg?.duration ?? handler?.duration ?? 2000,
    scripts,
    saveToFile:
      (typeof userEventConfig === 'object' && userEventConfig !== null
        ? userEventConfig.saveToFile
        : undefined) ?? global.saveToFile,
    appendToSession:
      (typeof userEventConfig === 'object' && userEventConfig !== null
        ? userEventConfig.appendToSession
        : undefined) ?? global.appendToSession,
    runOnce:
      (typeof userEventConfig === 'object' && userEventConfig !== null
        ? userEventConfig.runOnce
        : undefined) ?? false,
  };
}

export function resolveToolConfig(
  toolEventType: string,
  toolName: string
): ResolvedEventConfig {
  const tools = userConfig.tools as Record<
    string,
    Record<string, ToolConfig> | undefined
  >;
  const toolConfigs = tools?.[toolEventType];
  const toolConfig = toolConfigs?.[toolName];

  if (toolConfig === false) {
    return DISABLED_CONFIG;
  }

  if (!toolConfig) {
    return resolveEventConfig(toolEventType);
  }

  const handler = handlers[toolEventType];
  const global = userConfig;

  const scripts = resolveScripts(
    toolConfig,
    handler?.defaultScript ?? getDefaultScript(toolEventType),
    global.runScripts
  );
  const toastCfg = resolveToastOverride(toolConfig);

  return {
    enabled: true,
    toast: resolveToast(toolConfig, global.toast),
    toastTitle: toastCfg?.title ?? handler?.title ?? '',
    toastMessage: toastCfg?.message,
    toastVariant: toastCfg?.variant ?? handler?.variant ?? 'info',
    toastDuration: toastCfg?.duration ?? handler?.duration ?? 2000,
    scripts,
    saveToFile:
      (typeof toolConfig === 'object' && toolConfig !== null
        ? toolConfig.saveToFile
        : undefined) ?? global.saveToFile,
    appendToSession:
      (typeof toolConfig === 'object' && toolConfig !== null
        ? toolConfig.appendToSession
        : undefined) ?? global.appendToSession,
    runOnce:
      (typeof toolConfig === 'object' && toolConfig !== null
        ? toolConfig.runOnce
        : undefined) ?? false,
  };
}
