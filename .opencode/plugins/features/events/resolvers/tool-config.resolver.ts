import type { EventHandler } from '../../messages/default-handlers';
import type {
  ResolvedEventConfig,
  ToolConfig,
  ToolOverride,
} from '../../../types/config';
import type { ConfigResolverContext, ToolConfigResolver } from '../interfaces';
import { getBooleanField, resolveSaveToFile } from '../resolution';
import { resolveScripts, resolveToastOverride } from '../resolution';
import { TOAST_DURATION } from '../../../core/constants';
import { normalizeInputForHandler } from './normalize-input';
import { buildToastMessage } from './build-message';

function isToolOverride(cfg: ToolConfig): cfg is ToolOverride {
  return typeof cfg === 'object' && cfg !== null;
}

export class ToolConfigResolverImpl implements ToolConfigResolver {
  constructor(private context: ConfigResolverContext) {}

  private getToolHandler(
    toolName: string,
    toolEventType?: string
  ): EventHandler | undefined {
    if (toolEventType?.includes('.before')) {
      return this.context.handlers[`tool.execute.before.${toolName}`];
    }
    if (toolEventType?.includes('.after')) {
      return this.context.handlers[`tool.execute.after.${toolName}`];
    }
    return undefined;
  }

  private getHandler(eventType: string): EventHandler | undefined {
    return this.context.handlers[eventType];
  }

  private getDefaultScript(eventType: string): string {
    return `${eventType.replace(/\./g, '-')}.sh`;
  }

  private tryBuildMessage(
    handler: EventHandler,
    eventType: string,
    input: Record<string, unknown>,
    output?: Record<string, unknown>,
    allowedFields?: string[]
  ): string {
    try {
      const normalized = normalizeInputForHandler(eventType, input, output);
      return handler.buildMessage(normalized, allowedFields);
    } catch {
      return '';
    }
  }

  private isEmptyObject(obj: unknown): boolean {
    return (
      typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0
    );
  }

  private getDefaultConfig(
    toolEventType: string,
    input?: Record<string, unknown>
  ): ResolvedEventConfig {
    const handler = this.getHandler(toolEventType);
    const defaultCfg = this.context.default;
    const runScripts = getBooleanField(true, defaultCfg, 'runScripts', false);
    const scripts =
      runScripts && handler?.defaultScript ? [handler.defaultScript] : [];

    return {
      enabled: true,
      debug: getBooleanField(true, defaultCfg, 'debug', false),
      toast: getBooleanField(true, defaultCfg, 'toast', false),
      toastTitle: handler?.title ?? '',
      toastMessage: handler
        ? this.tryBuildMessage(
            handler,
            toolEventType,
            input ?? {},
            undefined,
            handler.allowedFields
          )
        : '',
      toastVariant: handler?.variant ?? 'info',
      toastDuration: handler?.duration ?? TOAST_DURATION.TWO_SECONDS,
      scripts,
      runScripts,
      saveToFile: resolveSaveToFile(undefined, defaultCfg),
      appendToSession: getBooleanField(
        true,
        defaultCfg,
        'appendToSession',
        false
      ),
      runOnlyOnce: false,
      scriptToasts: this.context.scriptToasts,
      allowedFields: handler?.allowedFields,
    };
  }

  resolve(
    toolEventType: string,
    toolName: string,
    input?: Record<string, unknown>,
    output?: Record<string, unknown>
  ): ResolvedEventConfig {
    const tools = this.context.getToolConfigs(toolEventType);
    const toolConfigs = tools as Record<string, ToolConfig> | undefined;
    const toolConfig = toolConfigs?.[toolName];

    if (toolConfig === false) {
      return {
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
        scriptToasts: this.context.scriptToasts,
      };
    }

    const defaultCfg = this.context.default;
    const toolHandler = this.getToolHandler(toolName, toolEventType);
    const eventHandler = toolHandler ?? this.getHandler(toolEventType);

    const eventBase: ResolvedEventConfig =
      this.context.getEventConfig(toolEventType) !== undefined
        ? this.resolveBase(toolEventType, input)
        : this.getDefaultConfig(toolEventType, input);

    const toastTitle = toolHandler?.title ?? eventHandler?.title ?? '';
    const toastVariant =
      toolHandler?.variant ?? eventHandler?.variant ?? 'info';
    const toastDuration =
      toolHandler?.duration ??
      eventHandler?.duration ??
      TOAST_DURATION.TWO_SECONDS;

    const toastMessage = toolHandler
      ? this.tryBuildMessage(
          toolHandler,
          toolEventType,
          input ?? {},
          output,
          toolHandler.allowedFields
        )
      : eventHandler
        ? this.tryBuildMessage(
            eventHandler,
            toolEventType,
            input ?? {},
            output,
            eventHandler.allowedFields
          )
        : '';

    const baseWithToolHandler: ResolvedEventConfig = {
      ...eventBase,
      toastTitle,
      toastMessage,
      toastVariant,
      toastDuration,
      scripts:
        eventBase.runScripts && toolHandler?.defaultScript
          ? [toolHandler.defaultScript]
          : eventBase.scripts,
    };

    if (!toolConfig || this.isEmptyObject(toolConfig)) {
      return baseWithToolHandler;
    }

    const { scripts } = resolveScripts(
      toolConfig,
      baseWithToolHandler.scripts[0] ??
        toolHandler?.defaultScript ??
        this.getDefaultScript(toolEventType),
      baseWithToolHandler.scripts
    );
    const toastCfg = resolveToastOverride(toolConfig);
    const toolOverride = isToolOverride(toolConfig) ? toolConfig : undefined;

    return {
      ...baseWithToolHandler,
      enabled: getBooleanField(
        toolConfig,
        defaultCfg,
        'enabled',
        baseWithToolHandler.enabled
      ),
      debug: getBooleanField(
        toolConfig,
        defaultCfg,
        'debug',
        baseWithToolHandler.debug
      ),
      toast: getBooleanField(
        toolConfig,
        defaultCfg,
        'toast',
        baseWithToolHandler.toast
      ),
      toastTitle: toastCfg?.title ?? baseWithToolHandler.toastTitle,
      runScripts: getBooleanField(
        toolConfig,
        defaultCfg,
        'runScripts',
        baseWithToolHandler.runScripts
      ),
      toastMessage: buildToastMessage(
        toastCfg,
        baseWithToolHandler.toastMessage,
        input ?? {},
        output
      ),
      toastVariant: toastCfg?.variant ?? baseWithToolHandler.toastVariant,
      toastDuration: toastCfg?.duration ?? baseWithToolHandler.toastDuration,
      scripts,
      saveToFile: resolveSaveToFile(toolConfig ?? defaultCfg, defaultCfg),
      appendToSession: getBooleanField(
        toolConfig,
        defaultCfg,
        'appendToSession',
        baseWithToolHandler.appendToSession
      ),
      runOnlyOnce: getBooleanField(
        toolConfig,
        defaultCfg,
        'runOnlyOnce',
        baseWithToolHandler.runOnlyOnce
      ),
      scriptToasts: this.context.scriptToasts,
      block: toolOverride?.block,
    };
  }

  private resolveBase(
    eventType: string,
    input?: Record<string, unknown>
  ): ResolvedEventConfig {
    const handler = this.getHandler(eventType);
    const userEventConfig = this.context.getEventConfig(eventType);
    const defaultCfg = this.context.default;
    const isDisabled = userEventConfig === false;
    const { scripts } = resolveScripts(
      userEventConfig ?? false,
      handler?.defaultScript ?? this.getDefaultScript(eventType),
      []
    );
    const toastCfg = resolveToastOverride(userEventConfig ?? false);

    return {
      enabled: !isDisabled,
      debug: getBooleanField(
        userEventConfig ?? false,
        defaultCfg,
        'debug',
        false
      ),
      toast: getBooleanField(
        userEventConfig ?? false,
        defaultCfg,
        'toast',
        false
      ),
      toastTitle: toastCfg?.title ?? handler?.title ?? '',
      runScripts: getBooleanField(
        userEventConfig ?? false,
        defaultCfg,
        'runScripts',
        false
      ),
      toastMessage: handler
        ? this.tryBuildMessage(
            handler,
            eventType,
            input ?? {},
            undefined,
            handler.allowedFields
          )
        : '',
      toastVariant: toastCfg?.variant ?? handler?.variant ?? 'info',
      toastDuration:
        toastCfg?.duration ?? handler?.duration ?? TOAST_DURATION.TWO_SECONDS,
      scripts,
      saveToFile: resolveSaveToFile(userEventConfig ?? false, defaultCfg),
      appendToSession: getBooleanField(
        userEventConfig ?? false,
        defaultCfg,
        'appendToSession',
        false
      ),
      runOnlyOnce: getBooleanField(
        userEventConfig ?? false,
        defaultCfg,
        'runOnlyOnce',
        false
      ),
      scriptToasts: this.context.scriptToasts,
      allowedFields: handler?.allowedFields,
    };
  }
}
