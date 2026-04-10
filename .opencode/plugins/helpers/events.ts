import { handlers, type EventHandler } from './default-handlers';
import { userConfig } from './user-events.config';
import { saveToFile } from './save-to-file';
import { UNKNOWN_EVENT_LOG_FILE } from './constants';
import type {
  ResolvedEventConfig,
  EventConfig,
  ToolConfig,
  ToastOverride,
  EventOverride,
} from './config';

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
  runOnlyOnce: false,
  debug: false,
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
  eventBaseScripts: string[]
): string[] {
  if (typeof cfg === 'object' && cfg !== null) {
    if (cfg.runScripts === false) {
      return [];
    }
    if (cfg.scripts !== undefined) {
      return cfg.scripts;
    }
    if (cfg.runScripts === true) {
      return [handlerDefaultScript];
    }
    return eventBaseScripts;
  }
  if (cfg === true) {
    return [handlerDefaultScript];
  }
  return [];
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

/**
 * Resolves the toast configuration for an event, checking event config first,
 * then falling back to default config.
 */
function resolveToast(
  eventCfg: EventConfig,
  defaultCfg: EventOverride | undefined
): boolean {
  if (typeof eventCfg === 'object' && eventCfg !== null) {
    const toast = eventCfg.toast;
    if (toast === undefined) {
      return resolveDefaultToast(defaultCfg);
    }
    if (typeof toast === 'boolean') {
      return toast;
    }
    if (typeof toast === 'object') {
      return toast.enabled ?? true;
    }
  }
  return resolveDefaultToast(defaultCfg);
}

function resolveDefaultToast(defaultCfg: EventOverride | undefined): boolean {
  if (!defaultCfg?.toast) {
    return false;
  }
  if (typeof defaultCfg.toast === 'boolean') {
    return defaultCfg.toast;
  }
  return defaultCfg.toast.enabled ?? true;
}

function getWithDefault(
  eventCfg: EventConfig,
  defaultCfg: EventOverride | undefined,
  key: keyof EventOverride,
  fallback: boolean
): boolean {
  if (key === 'toast') {
    return resolveToast(eventCfg, defaultCfg);
  }

  if (typeof eventCfg === 'object' && eventCfg !== null) {
    const eventValue = eventCfg[key];
    if (eventValue !== undefined) {
      return eventValue as boolean;
    }
  }
  if (defaultCfg !== null && defaultCfg !== undefined) {
    const defaultValue = defaultCfg[key];
    if (defaultValue !== undefined) {
      return defaultValue as boolean;
    }
  }
  return fallback;
}

function isEventDisabled(eventCfg: EventConfig): boolean {
  if (eventCfg === false) return true;
  if (typeof eventCfg === 'object' && eventCfg !== null) {
    return eventCfg.enabled === false;
  }
  return false;
}

/**
 * Resolves the event configuration for a given event type.
 * Configuration precedence: user config > handler defaults > system defaults.
 */
export function resolveEventConfig(eventType: string): ResolvedEventConfig {
  const handler = handlers[eventType];
  const userEventConfig =
    userConfig.events[eventType as keyof typeof userConfig.events];
  const defaultCfg = userConfig.default;

  if (!userConfig.enabled) {
    return DISABLED_CONFIG;
  }

  if (userEventConfig === undefined) {
    const isTool = eventType.startsWith('tool.');
    if (!isTool) {
      const timestamp = new Date().toISOString();
      saveToFile({
        content: `[${timestamp}] [WARN] Event '${eventType}' not configured. Add it to events config or set to false to disable.\n`,
        filename: UNKNOWN_EVENT_LOG_FILE,
      });
    }
    return {
      enabled: true,
      debug: getWithDefault(true, defaultCfg, 'debug', false),
      toast: getWithDefault(true, defaultCfg, 'toast', false),
      toastTitle: handler?.title ?? '',
      toastMessage: undefined,
      toastVariant: handler?.variant || 'info',
      toastDuration: handler?.duration ?? 2000,
      scripts: [],
      saveToFile: getWithDefault(true, defaultCfg, 'saveToFile', false),
      appendToSession: getWithDefault(
        true,
        defaultCfg,
        'appendToSession',
        false
      ),
      runOnlyOnce: false,
    };
  }

  if (isEventDisabled(userEventConfig)) {
    return DISABLED_CONFIG;
  }

  const scripts = resolveScripts(
    userEventConfig,
    handler?.defaultScript ?? getDefaultScript(eventType),
    []
  );
  const toastCfg = resolveToastOverride(userEventConfig);

  return {
    enabled: true,
    debug: getWithDefault(userEventConfig, defaultCfg, 'debug', false),
    toast: getWithDefault(userEventConfig, defaultCfg, 'toast', false),
    toastTitle: toastCfg?.title ?? handler?.title ?? '',
    toastMessage: toastCfg?.message,
    toastVariant: toastCfg?.variant || handler?.variant || 'info',
    toastDuration: toastCfg?.duration ?? handler?.duration ?? 2000,
    scripts,
    saveToFile: getWithDefault(
      userEventConfig,
      defaultCfg,
      'saveToFile',
      false
    ),
    appendToSession: getWithDefault(
      userEventConfig,
      defaultCfg,
      'appendToSession',
      false
    ),
    runOnlyOnce: getWithDefault(
      userEventConfig,
      defaultCfg,
      'runOnlyOnce',
      false
    ),
  };
}

/**
 * Resolves the tool configuration for a given tool event and tool name.
 * Merges tool-specific overrides directly from userConfig.default, bypassing event config unless explicitly defined.
 */
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

  const isEmptyObject = (obj: unknown): boolean => {
    return (
      typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0
    );
  };

  if (toolConfig === false) {
    return DISABLED_CONFIG;
  }

  // Determine event base config: use resolveEventConfig if event is defined,
  // otherwise fall back directly to userConfig.default via getDefaultConfig
  const eventBase: ResolvedEventConfig =
    userConfig.events[toolEventType as keyof typeof userConfig.events] !==
    undefined
      ? resolveEventConfig(toolEventType)
      : getDefaultConfig(toolEventType);

  if (!toolConfig || isEmptyObject(toolConfig)) {
    return eventBase;
  }

  const handler = handlers[toolEventType];
  const defaultCfg = userConfig.default;

  const scripts = resolveScripts(
    toolConfig,
    eventBase.scripts[0] ?? getDefaultScript(toolEventType),
    eventBase.scripts
  );
  const toastCfg = resolveToastOverride(toolConfig);

  return {
    ...eventBase,
    enabled: getWithDefault(
      toolConfig,
      defaultCfg,
      'enabled',
      eventBase.enabled
    ),
    debug: getWithDefault(toolConfig, defaultCfg, 'debug', eventBase.debug),
    toast: getWithDefault(toolConfig, defaultCfg, 'toast', eventBase.toast),
    toastTitle: toastCfg?.title ?? handler?.title ?? eventBase.toastTitle,
    toastMessage: toastCfg?.message ?? eventBase.toastMessage,
    toastVariant:
      toastCfg?.variant || handler?.variant || eventBase.toastVariant,
    toastDuration:
      toastCfg?.duration ?? handler?.duration ?? eventBase.toastDuration,
    scripts,
    saveToFile: getWithDefault(
      toolConfig,
      defaultCfg,
      'saveToFile',
      eventBase.saveToFile
    ),
    appendToSession: getWithDefault(
      toolConfig,
      defaultCfg,
      'appendToSession',
      eventBase.appendToSession
    ),
    runOnlyOnce: getWithDefault(
      toolConfig,
      defaultCfg,
      'runOnlyOnce',
      eventBase.runOnlyOnce
    ),
  };
}

function getDefaultConfig(toolEventType: string): ResolvedEventConfig {
  const handler = handlers[toolEventType];
  const defaultCfg = userConfig.default;

  return {
    enabled: true,
    debug: getWithDefault(true, defaultCfg, 'debug', false),
    toast: getWithDefault(true, defaultCfg, 'toast', false),
    toastTitle: handler?.title ?? '',
    toastMessage: undefined,
    toastVariant: handler?.variant ?? 'info',
    toastDuration: handler?.duration ?? 2000,
    scripts: [],
    saveToFile: getWithDefault(true, defaultCfg, 'saveToFile', false),
    appendToSession: getWithDefault(true, defaultCfg, 'appendToSession', false),
    runOnlyOnce: false,
  };
}
