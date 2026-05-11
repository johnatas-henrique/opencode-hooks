import type { BuildMessageFn } from '.opencode/plugins/types/messages';

import type {
  EventOverride,
  ScriptToastsConfig,
  EventConfig,
  ToolConfig,
  ResolvedEventConfig,
  ScriptEntry,
  EventVariant,
} from '.opencode/plugins/types/config';
import type { EventInput } from '.opencode/plugins/types/core';

export interface EventHandler {
  title: string;
  variant: EventVariant;
  duration: number;
  defaultScript: string;
  buildMessage: BuildMessageFn;
  allowedFields?: string[];
  defaultTemplate?: string;
}

export interface ConfigResolverContext {
  readonly enabled: boolean;
  readonly default: EventOverride;
  readonly scriptToasts: ScriptToastsConfig;
  readonly handlers: Record<string, EventHandler>;
  readonly getEventConfig: (eventType: string) => EventConfig | undefined;
  readonly getToolConfigs: (
    toolEventType: string
  ) => Record<string, ToolConfig> | undefined;
  readonly getProjectDir: (input?: EventInput) => string;
  readonly getClaudeScripts: (
    projectDir: string
  ) => Record<string, ScriptEntry[]>;
}

export interface ResolverFactory {
  createEventResolver: (context: ConfigResolverContext) => EventConfigResolver;
  createToolResolver: (context: ConfigResolverContext) => ToolConfigResolver;
}

export interface EventConfigResolver {
  resolve: (
    eventType: string,
    input?: Record<string, unknown>,
    output?: Record<string, unknown>
  ) => ResolvedEventConfig;
}

export interface ToolConfigResolver {
  resolve: (
    toolEventType: string,
    toolName: string,
    input?: Record<string, unknown>,
    output?: Record<string, unknown>
  ) => ResolvedEventConfig;
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
  readonly scripts: ScriptEntry[];
  readonly runScripts: boolean;
}

export interface ResolvedSaveToFile {
  readonly enabled: boolean;
  readonly template?: string;
  readonly path?: string;
}
