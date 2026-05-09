import type {
  EventHandler,
  ConfigResolverContext,
  ToolConfigResolver,
} from '.opencode/plugins/types/events';
import type {
  ResolvedEventConfig,
  ToolConfig,
} from '.opencode/plugins/types/config';
import {
  resolveScripts,
  asScriptEntry,
  mergeClaudeScripts,
} from '.opencode/plugins/features/events/resolution/scripts';
import { resolveToastOverride } from '.opencode/plugins/features/events/resolution/toast';
import { getBooleanField } from '.opencode/plugins/features/events/resolution/boolean-field';
import { buildToastMessage } from '.opencode/plugins/features/events/resolvers/build-message';
import { DEFAULTS } from '.opencode/plugins/core/constants';
import { DefaultConfigResolver } from '.opencode/plugins/features/events/resolvers/default-config-resolver';

export class DefaultToolConfigResolver implements ToolConfigResolver {
  private defaultResolver: DefaultConfigResolver;

  constructor(private context: ConfigResolverContext) {
    this.defaultResolver = new DefaultConfigResolver(context);
  }

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

  private isEmptyObject(obj: unknown): boolean {
    return (
      typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0
    );
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
        scriptToasts: this.context.scriptToasts,
      };
    }

    const defaultCfg = this.context.default;
    const toolHandler = this.getToolHandler(toolName, toolEventType);
    const eventHandler = toolHandler ?? this.getHandler(toolEventType);

    const userEventConfig = this.context.getEventConfig(toolEventType);
    const hasUserEventCfg = userEventConfig !== undefined;

    const eventBase: ResolvedEventConfig = hasUserEventCfg
      ? userEventConfig === false
        ? {
            ...DEFAULTS.config.disabled,
            scriptToasts: this.context.scriptToasts,
          }
        : this.defaultResolver.buildMerged(
            userEventConfig,
            eventHandler,
            toolEventType,
            defaultCfg,
            input,
            output
          )
      : (() => {
          const base = this.defaultResolver.buildDefault(
            eventHandler,
            toolEventType,
            defaultCfg,
            input
          );
          if (base.runScripts && eventHandler?.defaultScript) {
            return {
              ...base,
              scripts: [asScriptEntry(eventHandler.defaultScript)],
            };
          }
          return base;
        })();

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
      ? this.defaultResolver.tryBuildMessage(
          toolHandler,
          toolEventType,
          input ?? {},
          output,
          toolHandler.allowedFields
        )
      : eventHandler
        ? this.defaultResolver.tryBuildMessage(
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
      return this.defaultResolver.applyClaudeScripts(
        baseWithToolHandler,
        toolEventType,
        input,
        toolName
      );
    }

    const { scripts } = resolveScripts(
      toolConfig,
      baseWithToolHandler.scripts[0]?.path ??
        toolHandler?.defaultScript ??
        this.defaultResolver.getDefaultScript(toolEventType),
      baseWithToolHandler.scripts
    );

    const toastCfg = resolveToastOverride(toolConfig);
    const projectDir = this.context.getProjectDir(input);
    const claudeScripts = this.context.getClaudeScripts(projectDir);
    const mergedScripts = mergeClaudeScripts(
      scripts,
      toolEventType,
      toolName,
      claudeScripts
    );

    return {
      ...baseWithToolHandler,
      enabled: getBooleanField(
        toolConfig,
        defaultCfg,
        'enabled',
        baseWithToolHandler.enabled
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
}
