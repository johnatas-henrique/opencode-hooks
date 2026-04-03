import { handlers } from './handlers';
import { userConfig } from './user-events.config';
import type {
  ResolvedEventConfig,
  EventConfig,
  ToolConfig,
  ToastOverride,
} from './event-types';

export { ResolvedEventConfig };

export function getHandler(eventType: string) {
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
        ? [handler?.defaultScript ?? getDefaultScript(eventType)]
        : [],
      saveToFile: global.saveToFile,
      appendToSession: global.appendToSession,
    };
  }

  if (userEventConfig === false) {
    return { enabled: false } as ResolvedEventConfig;
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
    toastTitle: (toastCfg?.title as string) ?? handler?.title ?? '',
    toastMessage: toastCfg?.message as string | undefined,
    toastVariant:
      (toastCfg?.variant as ResolvedEventConfig['toastVariant']) ??
      handler?.variant ??
      'info',
    toastDuration: (toastCfg?.duration as number) ?? handler?.duration ?? 2000,
    scripts,
    saveToFile:
      (typeof userEventConfig === 'object' && userEventConfig !== null
        ? userEventConfig.saveToFile
        : undefined) ?? global.saveToFile,
    appendToSession:
      (typeof userEventConfig === 'object' && userEventConfig !== null
        ? userEventConfig.appendToSession
        : undefined) ?? global.appendToSession,
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
    return { enabled: false } as ResolvedEventConfig;
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
    toastTitle: (toastCfg?.title as string) ?? handler?.title ?? '',
    toastMessage: toastCfg?.message as string | undefined,
    toastVariant:
      (toastCfg?.variant as ResolvedEventConfig['toastVariant']) ??
      handler?.variant ??
      'info',
    toastDuration: (toastCfg?.duration as number) ?? handler?.duration ?? 2000,
    scripts,
    saveToFile:
      (typeof toolConfig === 'object' && toolConfig !== null
        ? toolConfig.saveToFile
        : undefined) ?? global.saveToFile,
    appendToSession:
      (typeof toolConfig === 'object' && toolConfig !== null
        ? toolConfig.appendToSession
        : undefined) ?? global.appendToSession,
  };
}
