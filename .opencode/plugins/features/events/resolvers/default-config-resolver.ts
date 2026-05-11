import type { EventInput } from '.opencode/plugins/types/core';
import type {
  EventHandler,
  ConfigResolverContext,
} from '.opencode/plugins/types/events';
import type {
  ResolvedEventConfig,
  EventConfig,
  EventOverride,
  ScriptEntry,
} from '.opencode/plugins/types/config';
import { DEFAULTS } from '.opencode/plugins/core/constants';
import {
  resolveScripts,
  mergeClaudeScripts,
} from '.opencode/plugins/features/events/resolution/scripts';
import { resolveToastOverride } from '.opencode/plugins/features/events/resolution/toast';
import { getBooleanField } from '.opencode/plugins/features/events/resolution/boolean-field';
import { normalizeInputForHandler } from '.opencode/plugins/features/events/resolvers/normalize-input';
import { buildToastMessage } from '.opencode/plugins/features/events/resolvers/build-message';

export class DefaultConfigResolver {
  constructor(private context: ConfigResolverContext) {}

  getDefaultScript(eventType: string): string {
    return `${eventType.replace(/\./g, '-')}.sh`;
  }

  tryBuildMessage(
    handler: EventHandler,
    eventType: string,
    input?: Record<string, unknown>,
    output?: Record<string, unknown>,
    allowedFields?: string[]
  ): string {
    try {
      const normalized = normalizeInputForHandler(
        eventType,
        input ?? {},
        output
      );
      return handler.buildMessage(normalized, allowedFields);
    } catch {
      return '';
    }
  }

  buildDefault(
    handler: EventHandler | undefined,
    eventType: string,
    defaultCfg: EventOverride,
    input?: EventInput
  ): ResolvedEventConfig {
    const allowedFields = handler?.allowedFields;
    return {
      enabled: true,
      toast: getBooleanField(true, defaultCfg, 'toast', false),
      toastTitle: handler ? handler.title : '',
      runScripts: getBooleanField(true, defaultCfg, 'runScripts', false),
      toastMessage: handler
        ? this.tryBuildMessage(
            handler,
            eventType,
            input,
            undefined,
            allowedFields
          )
        : '',
      toastVariant: handler ? handler.variant : 'info',
      toastDuration: handler
        ? handler.duration
        : DEFAULTS.toast.durations.TWO_SECONDS,
      scripts: [],
      logToAudit: true,
      appendToSession: getBooleanField(
        true,
        defaultCfg,
        'appendToSession',
        false
      ),
      runOnlyOnce: false,
      scriptToasts: this.context.scriptToasts,
      allowedFields,
    };
  }

  buildMerged(
    userCfg: EventConfig,
    handler: EventHandler | undefined,
    eventType: string,
    defaultCfg: EventOverride,
    input?: EventInput,
    output?: Record<string, unknown>
  ): ResolvedEventConfig {
    const userOverride =
      typeof userCfg === 'object' && userCfg !== null ? userCfg : undefined;

    const { scripts: rawScripts } = resolveScripts(
      userCfg,
      handler?.defaultScript ?? this.getDefaultScript(eventType),
      []
    );
    const scripts: ScriptEntry[] = rawScripts.map((s: ScriptEntry) => ({
      ...s,
      scriptType:
        s.scriptType ??
        (s.source === 'native' ? 'settings-native' : 'settings-claude'),
    }));
    const toastCfg = resolveToastOverride(userCfg);
    const allowedFields = userOverride?.allowedFields ?? handler?.allowedFields;

    return {
      enabled: true,
      toast: getBooleanField(userCfg, defaultCfg, 'toast', false),
      toastTitle: toastCfg?.title ?? (handler ? handler.title : ''),
      runScripts: getBooleanField(userCfg, defaultCfg, 'runScripts', false),
      toastMessage: buildToastMessage(
        toastCfg,
        handler
          ? this.tryBuildMessage(
              handler,
              eventType,
              input,
              output,
              allowedFields
            )
          : '',
        input ?? {},
        output
      ),
      toastVariant: toastCfg?.variant ?? (handler ? handler.variant : 'info'),
      toastDuration:
        toastCfg?.duration ??
        (handler ? handler.duration : DEFAULTS.toast.durations.TWO_SECONDS),
      scripts,
      logToAudit: userOverride?.logToAudit ?? defaultCfg.logToAudit ?? true,
      appendToSession: getBooleanField(
        userCfg,
        defaultCfg,
        'appendToSession',
        false
      ),
      runOnlyOnce: getBooleanField(userCfg, defaultCfg, 'runOnlyOnce', false),
      scriptToasts: this.context.scriptToasts,
      allowedFields,
    };
  }

  applyClaudeScripts(
    config: ResolvedEventConfig,
    eventType: string,
    input?: EventInput,
    toolName?: string
  ): ResolvedEventConfig {
    const projectDir = this.context.getProjectDir(input);
    const claudeScripts = this.context.getClaudeScripts(projectDir);
    const merged = mergeClaudeScripts(
      config.scripts,
      eventType,
      toolName,
      claudeScripts
    );

    if (merged === config.scripts) return config;

    const userCfg = this.context.getEventConfig(eventType);
    if (
      !config.runScripts &&
      userCfg !== undefined &&
      typeof userCfg === 'object' &&
      userCfg !== null &&
      'runScripts' in userCfg
    ) {
      return config;
    }

    return { ...config, scripts: merged, runScripts: true };
  }
}
