import type {
  ResolvedEventConfig,
  EventConfig,
  ToolConfig,
  EventOverride,
  ScriptToastsConfig,
} from '../../types/config';
import type { EventHandler } from '../messages/default-handlers';

export interface ConfigResolverContext {
  readonly enabled: boolean;
  readonly default: EventOverride;
  readonly scriptToasts: ScriptToastsConfig;
  readonly handlers: Record<string, EventHandler>;
  readonly getEventConfig: (eventType: string) => EventConfig | undefined;
  readonly getToolConfigs: (
    toolEventType: string
  ) => Record<string, ToolConfig> | undefined;
}

export interface ResolverFactory {
  createEventResolver(context: ConfigResolverContext): EventConfigResolver;
  createToolResolver(context: ConfigResolverContext): ToolConfigResolver;
}

export interface EventConfigResolver {
  resolve(
    eventType: string,
    input?: Record<string, unknown>,
    output?: Record<string, unknown>
  ): ResolvedEventConfig;
}

export interface ToolConfigResolver {
  resolve(
    toolEventType: string,
    toolName: string,
    input?: Record<string, unknown>,
    output?: Record<string, unknown>
  ): ResolvedEventConfig;
}

export interface BooleanFieldOptions {
  readonly key: keyof EventOverride | 'toast';
  readonly fallback: boolean;
}

export interface ResolvedToast {
  readonly enabled: boolean;
  readonly title?: string;
  readonly message?: string;
  readonly variant?: string;
  readonly duration?: number;
}

export interface ResolvedScripts {
  readonly scripts: string[];
  readonly runScripts: boolean;
}

export interface ResolvedSaveToFile {
  readonly enabled: boolean;
  readonly template?: string;
  readonly path?: string;
}
