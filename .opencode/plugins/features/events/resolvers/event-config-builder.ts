import type { EventInput } from '.opencode/plugins/types/core';
import type {
  EventHandler,
  ConfigResolverContext,
} from '.opencode/plugins/types/events';
import type {
  ResolvedEventConfig,
  EventConfig,
  EventOverride,
} from '.opencode/plugins/types/config';
import { DEFAULTS } from '.opencode/plugins/core/constants';
import { DefaultConfigResolver } from '.opencode/plugins/features/events/resolvers/default-config-resolver';

export class ConfigBuilder {
  private handler?: EventHandler;
  private userEventConfig?: EventConfig;
  private isOverride = false;
  private defaultResolver: DefaultConfigResolver;

  constructor(
    private context: ConfigResolverContext,
    private eventType: string,
    private input?: EventInput,
    private output?: Record<string, unknown>
  ) {
    this.defaultResolver = new DefaultConfigResolver(context);
  }

  resolve(): ResolvedEventConfig {
    if (!this.context.enabled) {
      return DEFAULTS.config.disabled;
    }

    this.handler = this.context.handlers[this.eventType];
    this.userEventConfig = this.context.getEventConfig(this.eventType);
    const defaultCfg = this.context.default;

    if (this.userEventConfig === undefined) {
      const config = this.defaultResolver.buildDefault(
        this.handler,
        this.eventType,
        defaultCfg,
        this.input
      );
      return this.defaultResolver.applyClaudeScripts(
        config,
        this.eventType,
        this.input
      );
    }

    if (this.isEventDisabled()) {
      return DEFAULTS.config.disabled;
    }

    const config = this.defaultResolver.buildMerged(
      this.userEventConfig,
      this.handler,
      this.eventType,
      defaultCfg,
      this.input,
      this.output
    );
    return this.defaultResolver.applyClaudeScripts(
      config,
      this.eventType,
      this.input
    );
  }

  private isEventDisabled(): boolean {
    if (this.userEventConfig === false) return true;
    if (
      typeof this.userEventConfig === 'object' &&
      this.userEventConfig !== null
    ) {
      this.isOverride = true;
      return (this.userEventConfig as EventOverride).enabled === false;
    }
    return false;
  }
}
