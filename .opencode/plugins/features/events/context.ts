import type {
  UserEventsConfig,
  ScriptEntry,
} from '.opencode/plugins/types/config';
import type {
  EventHandler,
  ConfigResolverContext,
  ResolverFactory,
  EventConfigResolver,
  ToolConfigResolver,
} from '.opencode/plugins/types/events';
import { EventConfigResolverImpl } from '.opencode/plugins/features/events/resolvers/event-config.resolver';
import { ToolConfigResolverImpl } from '.opencode/plugins/features/events/resolvers/tool-config.resolver';
import { handlers } from '.opencode/plugins/features/handlers';
import { loadClaudeSettings } from '.opencode/plugins/config/claude-settings';

export function createContext(
  userConfig: UserEventsConfig,
  eventHandlers?: Record<string, EventHandler>
): ConfigResolverContext {
  let claudeScripts: Record<string, ScriptEntry[]> = {};
  let claudeUnsupported: string[] = [];
  if (userConfig.loadClaudeHookSettings.enabled) {
    const result = loadClaudeSettings(process.cwd());
    claudeScripts = result.hooks;
    claudeUnsupported = result.unsupported;
  }

  return {
    get enabled() {
      return userConfig.enabled;
    },
    get default() {
      return userConfig.default;
    },
    get scriptToasts() {
      return userConfig.scriptToasts;
    },
    get handlers() {
      return eventHandlers ?? handlers;
    },
    get claudeScripts() {
      return claudeScripts;
    },
    get claudeUnsupported() {
      return claudeUnsupported;
    },
    getEventConfig: (eventType) =>
      userConfig.events[eventType as keyof typeof userConfig.events],
    getToolConfigs: (toolEventType) =>
      userConfig.tools[toolEventType as keyof typeof userConfig.tools],
  };
}

export function createFactory(context: ConfigResolverContext): ResolverFactory {
  return {
    createEventResolver: (_ctx) => new EventConfigResolverImpl(context),
    createToolResolver: (_ctx) => new ToolConfigResolverImpl(context),
  };
}

export function createEventResolver(
  userConfig: UserEventsConfig
): EventConfigResolver {
  const context = createContext(userConfig);
  return new EventConfigResolverImpl(context);
}

export function createToolResolver(
  userConfig: UserEventsConfig
): ToolConfigResolver {
  const context = createContext(userConfig);
  return new ToolConfigResolverImpl(context);
}
