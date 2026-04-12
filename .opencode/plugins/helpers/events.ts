import { handlers, type EventHandler } from './default-handlers';
import { userConfig } from './user-events.config';
import { saveToFile } from './save-to-file';
import { UNKNOWN_EVENT_LOG_FILE, TOAST_DURATION } from './constants';
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
  toastMessage: '',
  toastVariant: 'info',
  toastDuration: 0,
  scripts: [],
  runScripts: false,
  saveToFile: false,
  appendToSession: false,
  runOnlyOnce: false,
  debug: false,
  scriptToasts: {
    showOutput: true,
    showError: true,
    outputVariant: 'info',
    errorVariant: 'error',
    outputDuration: TOAST_DURATION.FIVE_SECONDS,
    errorDuration: TOAST_DURATION.FIFTEEN_SECONDS,
    outputTitle: 'Script Output',
    errorTitle: 'Script Error',
  },
};

function tryBuildMessage(
  handler: EventHandler,
  eventType: string,
  input: Record<string, unknown>,
  output?: Record<string, unknown>
): string {
  try {
    const normalized = normalizeInputForHandler(eventType, input, output);
    return handler.buildMessage(normalized);
  } catch {
    return '';
  }
}

export function normalizeInputForHandler(
  eventType: string,
  input: Record<string, unknown>,
  output?: Record<string, unknown>
): Record<string, unknown> {
  if (eventType.startsWith('tool.execute.')) {
    return { input, output };
  }

  if (eventType === 'shell.env') {
    return { properties: input, output };
  }

  if (eventType.startsWith('chat.') || eventType.startsWith('experimental.')) {
    return { properties: input, output };
  }

  if (eventType.startsWith('permission.')) {
    return { properties: input, output };
  }

  if (eventType === 'command.execute.before') {
    return { properties: input, output };
  }

  if (input.properties && typeof input.properties === 'object') {
    return { properties: input.properties };
  }

  return { properties: input };
}

export function getHandler(eventType: string): EventHandler | undefined {
  return handlers[eventType];
}

export function getToolHandler(
  toolName: string,
  toolEventType?: string
): EventHandler | undefined {
  if (toolEventType?.includes('.before')) {
    return handlers[`tool.execute.before.${toolName}`];
  }
  if (toolEventType?.includes('.after')) {
    return handlers[`tool.execute.after.${toolName}`];
  }
  return undefined;
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
export function resolveEventConfig(
  eventType: string,
  input?: Record<string, unknown>,
  output?: Record<string, unknown>
): ResolvedEventConfig {
  const handler = handlers[eventType];
  const userEventConfig =
    userConfig.events[eventType as keyof typeof userConfig.events];
  const defaultCfg = userConfig.default;

  if (!userConfig.enabled) {
    return DISABLED_CONFIG;
  }

  if (userEventConfig === undefined) {
    const isTool = eventType.startsWith('tool.');
    const hasHandler = !!handler;
    if (!isTool && !hasHandler) {
      const timestamp = new Date().toISOString();
      saveToFile({
        content: JSON.stringify({
          timestamp,
          type: 'UNKNOWN_EVENT_IN_RESOLVE',
          data: eventType,
        }),
        filename: UNKNOWN_EVENT_LOG_FILE,
      });
    }
    return {
      enabled: true,
      debug: getWithDefault(true, defaultCfg, 'debug', false),
      toast: getWithDefault(true, defaultCfg, 'toast', false),
      toastTitle: handler?.title ?? '',
      runScripts: getWithDefault(true, defaultCfg, 'runScripts', false),
      toastMessage: handler
        ? tryBuildMessage(handler, eventType, input ?? {}, output)
        : '',
      toastVariant: handler?.variant ?? 'info',
      toastDuration: handler?.duration ?? TOAST_DURATION.TWO_SECONDS,
      scripts: [],
      saveToFile: getWithDefault(true, defaultCfg, 'saveToFile', false),
      appendToSession: getWithDefault(
        true,
        defaultCfg,
        'appendToSession',
        false
      ),
      runOnlyOnce: false,
      scriptToasts: userConfig.scriptToasts,
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
    runScripts: getWithDefault(
      userEventConfig,
      defaultCfg,
      'runScripts',
      false
    ),
    toastMessage:
      toastCfg?.message ??
      (handler ? tryBuildMessage(handler, eventType, input ?? {}, output) : ''),
    toastVariant: toastCfg?.variant ?? handler?.variant ?? 'info',
    toastDuration:
      toastCfg?.duration ?? handler?.duration ?? TOAST_DURATION.TWO_SECONDS,
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
    scriptToasts: userConfig.scriptToasts,
  };
}

/**
 * Resolves the tool configuration for a given tool event and tool name.
 * Merges tool-specific overrides directly from userConfig.default, bypassing event config unless explicitly defined.
 */
export function resolveToolConfig(
  toolEventType: string,
  toolName: string,
  input?: Record<string, unknown>,
  output?: Record<string, unknown>
): ResolvedEventConfig {
  const tools = userConfig.tools as Record<
    string,
    Record<string, ToolConfig> | undefined
  >;
  const toolConfigs = tools?.[toolEventType];
  const toolConfig = toolConfigs?.[toolName];

  const isEmptyObject = (obj: unknown): obj is Record<string, never> => {
    return (
      typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0
    );
  };

  if (toolConfig === false) {
    return DISABLED_CONFIG;
  }

  const defaultCfg = userConfig.default;
  const toolHandler = getToolHandler(toolName, toolEventType);
  const eventHandler = toolHandler ?? handlers[toolEventType];

  // Determine event base config: use resolveEventConfig if event is defined,
  // otherwise fall back directly to userConfig.default via getDefaultConfig
  const eventBase: ResolvedEventConfig =
    userConfig.events[toolEventType as keyof typeof userConfig.events] !==
    undefined
      ? resolveEventConfig(toolEventType, input)
      : getDefaultConfig(toolEventType, input);

  // Build base config that incorporates tool handler defaults
  const baseWithToolHandler: ResolvedEventConfig = {
    ...eventBase,
    toastTitle: toolHandler?.title ?? eventHandler?.title,
    toastMessage: toolHandler
      ? tryBuildMessage(toolHandler, toolEventType, input ?? {}, output)
      : eventHandler
        ? tryBuildMessage(eventHandler, toolEventType, input ?? {}, output)
        : '',
    toastVariant: toolHandler?.variant ?? eventHandler?.variant,
    toastDuration: toolHandler?.duration ?? eventHandler?.duration,
    scripts:
      eventBase.runScripts && toolHandler?.defaultScript
        ? [toolHandler.defaultScript]
        : eventBase.scripts,
  };

  // Empty tool config → inherit from baseWithToolHandler
  if (!toolConfig || isEmptyObject(toolConfig)) {
    return baseWithToolHandler;
  }

  const scripts = resolveScripts(
    toolConfig,
    baseWithToolHandler.scripts[0] ??
      toolHandler?.defaultScript ??
      getDefaultScript(toolEventType),
    baseWithToolHandler.scripts
  );
  const toastCfg = resolveToastOverride(toolConfig);

  return {
    ...baseWithToolHandler,
    enabled: getWithDefault(
      toolConfig,
      defaultCfg,
      'enabled',
      baseWithToolHandler.enabled
    ),
    debug: getWithDefault(
      toolConfig,
      defaultCfg,
      'debug',
      baseWithToolHandler.debug
    ),
    toast: getWithDefault(
      toolConfig,
      defaultCfg,
      'toast',
      baseWithToolHandler.toast
    ),
    toastTitle: toastCfg?.title ?? baseWithToolHandler.toastTitle,
    runScripts: getWithDefault(
      toolConfig,
      defaultCfg,
      'runScripts',
      baseWithToolHandler.runScripts
    ),
    toastMessage: toastCfg?.message ?? baseWithToolHandler.toastMessage,
    toastVariant: toastCfg?.variant ?? baseWithToolHandler.toastVariant,
    toastDuration: toastCfg?.duration ?? baseWithToolHandler.toastDuration,
    scripts,
    saveToFile: getWithDefault(
      toolConfig,
      defaultCfg,
      'saveToFile',
      baseWithToolHandler.saveToFile
    ),
    appendToSession: getWithDefault(
      toolConfig,
      defaultCfg,
      'appendToSession',
      baseWithToolHandler.appendToSession
    ),
    runOnlyOnce: getWithDefault(
      toolConfig,
      defaultCfg,
      'runOnlyOnce',
      baseWithToolHandler.runOnlyOnce
    ),
    scriptToasts: userConfig.scriptToasts,
  };
}

function getDefaultConfig(
  toolEventType: string,
  input?: Record<string, unknown>
): ResolvedEventConfig {
  const handler = handlers[toolEventType];
  const defaultCfg = userConfig.default;

  const runScripts = getWithDefault(true, defaultCfg, 'runScripts', false);
  const scripts =
    runScripts && handler?.defaultScript ? [handler.defaultScript] : [];

  return {
    enabled: true,
    debug: getWithDefault(true, defaultCfg, 'debug', false),
    toast: getWithDefault(true, defaultCfg, 'toast', false),
    toastTitle: handler?.title ?? '',
    toastMessage: handler
      ? tryBuildMessage(handler, toolEventType, input ?? {})
      : '',
    toastVariant: handler?.variant ?? 'info',
    toastDuration: handler?.duration ?? TOAST_DURATION.TWO_SECONDS,
    scripts,
    runScripts,
    saveToFile: getWithDefault(true, defaultCfg, 'saveToFile', false),
    appendToSession: getWithDefault(true, defaultCfg, 'appendToSession', false),
    runOnlyOnce: false,
    scriptToasts: userConfig.scriptToasts,
  };
}
