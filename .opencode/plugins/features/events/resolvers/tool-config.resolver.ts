import type {
  EventHandler,
  ConfigResolverContext,
  ToolConfigResolver,
} from '.opencode/plugins/types/events';
import type {
  ResolvedEventConfig,
  ToolConfig,
  ScriptEntry,
} from '.opencode/plugins/types/config';
import { getBooleanField } from '.opencode/plugins/features/events/resolution/boolean-field';
import {
  resolveScripts,
  asScriptEntry,
  mergeClaudeScripts,
} from '.opencode/plugins/features/events/resolution/scripts';
import { resolveToastOverride } from '.opencode/plugins/features/events/resolution/toast';
import { DEFAULTS } from '.opencode/plugins/core/constants';
import { normalizeInputForHandler } from '.opencode/plugins/features/events/resolvers/normalize-input';
import { buildToastMessage } from '.opencode/plugins/features/events/resolvers/build-message';

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
    const scripts: ScriptEntry[] =
      runScripts && handler?.defaultScript
        ? [asScriptEntry(handler.defaultScript)]
        : [];

    return {
      enabled: true,
      debug: getBooleanField(true, defaultCfg, 'debug', false),
      toast: getBooleanField(true, defaultCfg, 'toast', false),
      toastTitle: handler ? handler.title : '',
      toastMessage: handler
        ? this.tryBuildMessage(
            handler,
            toolEventType,
            input ?? {},
            undefined,
            handler.allowedFields
          )
        : '',
      toastVariant: handler ? handler.variant : 'info',
      toastDuration: handler
        ? handler.duration
        : DEFAULTS.toast.durations.TWO_SECONDS,
      scripts,
      runScripts,
      logToAudit: getBooleanField(true, defaultCfg, 'logToAudit', true),
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
        logToAudit: false,
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

    const toastTitle = toolHandler
      ? toolHandler.title
      : eventHandler
        ? eventHandler.title
        : '';
    const toastVariant = toolHandler
      ? toolHandler.variant
      : eventHandler
        ? eventHandler.variant
        : 'info';
    const toastDuration = toolHandler
      ? toolHandler.duration
      : eventHandler
        ? eventHandler.duration
        : DEFAULTS.toast.durations.TWO_SECONDS;
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
          ? [asScriptEntry(toolHandler.defaultScript)]
          : eventBase.scripts,
    };

    if (!toolConfig || this.isEmptyObject(toolConfig)) {
      return this.applyClaudeScripts(
        baseWithToolHandler,
        toolEventType,
        toolName
      );
    }

    const { scripts } = resolveScripts(
      toolConfig,
      baseWithToolHandler.scripts[0]?.path ??
        toolHandler?.defaultScript ??
        this.getDefaultScript(toolEventType),
      baseWithToolHandler.scripts
    );
    const toastCfg = resolveToastOverride(toolConfig);

    const mergedScripts = mergeClaudeScripts(
      scripts,
      toolEventType,
      toolName,
      this.context.claudeScripts
    );

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
      scripts: mergedScripts,
      logToAudit: getBooleanField(toolConfig, defaultCfg, 'logToAudit', true),
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
    };
  }

  private applyClaudeScripts(
    config: ResolvedEventConfig,
    toolEventType: string,
    toolName: string
  ): ResolvedEventConfig {
    if (!config.runScripts) return config;
    const merged = mergeClaudeScripts(
      config.scripts,
      toolEventType,
      toolName,
      this.context.claudeScripts
    );
    if (merged === config.scripts) return config;
    return { ...config, scripts: merged };
  }

  private resolveBase(
    eventType: string,
    input?: Record<string, unknown>
  ): ResolvedEventConfig {
    const handler = this.getHandler(eventType);
    const userEventConfig = this.context.getEventConfig(eventType);
    const defaultCfg = this.context.default;
    const isDisabled = userEventConfig === false;
    const cfg = userEventConfig ?? false;
    const { scripts } = resolveScripts(
      cfg,
      handler?.defaultScript ?? this.getDefaultScript(eventType),
      []
    );
    const toastCfg = resolveToastOverride(cfg);

    return {
      enabled: !isDisabled,
      debug: getBooleanField(cfg, defaultCfg, 'debug', false),
      toast: getBooleanField(cfg, defaultCfg, 'toast', false),
      toastTitle: toastCfg?.title ?? (handler ? handler.title : ''),
      runScripts: getBooleanField(cfg, defaultCfg, 'runScripts', false),
      toastMessage: handler
        ? this.tryBuildMessage(
            handler,
            eventType,
            input ?? {},
            undefined,
            handler.allowedFields
          )
        : '',
      toastVariant: toastCfg?.variant ?? (handler ? handler.variant : 'info'),
      toastDuration:
        toastCfg?.duration ??
        (handler ? handler.duration : DEFAULTS.toast.durations.TWO_SECONDS),
      scripts,
      logToAudit: getBooleanField(cfg, defaultCfg, 'logToAudit', true),
      appendToSession: getBooleanField(
        cfg,
        defaultCfg,
        'appendToSession',
        false
      ),
      runOnlyOnce: getBooleanField(cfg, defaultCfg, 'runOnlyOnce', false),
      scriptToasts: this.context.scriptToasts,
      allowedFields: handler?.allowedFields,
    };
  }
}
