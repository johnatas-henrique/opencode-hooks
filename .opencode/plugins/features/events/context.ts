import type { UserEventsConfig } from '.opencode/plugins/types/config';
import type { EventInput } from '.opencode/plugins/types/core';
import type {
  EventHandler,
  ConfigResolverContext,
  EventConfigResolver,
  ToolConfigResolver,
} from '.opencode/plugins/types/events';
import { DelegatingEventConfigResolver } from '.opencode/plugins/features/events/resolvers/event-config.resolver';
import { DefaultToolConfigResolver } from '.opencode/plugins/features/events/resolvers/tool-config.resolver';
import { handlers } from '.opencode/plugins/features/handlers';
import { loadClaudeSettings } from '.opencode/plugins/features/adapters/claude-settings';

export function createContext(
  userConfig: UserEventsConfig,
  eventHandlers?: Record<string, EventHandler>
): ConfigResolverContext {
  const { loadGlobalClaudeHooks, loadLocalClaudeHooks } =
    userConfig.loadClaudeHookSettings;

  return {
    enabled: userConfig.enabled,
    default: userConfig.default,
    scriptToasts: userConfig.scriptToasts,
    handlers: eventHandlers ?? handlers,

    getEventConfig: (eventType: string) =>
      userConfig.events[eventType as keyof typeof userConfig.events],
    getToolConfigs: (toolEventType: string) =>
      userConfig.tools[toolEventType as keyof typeof userConfig.tools],

    getProjectDir: (input?: EventInput) => {
      const props = input?.properties as Record<string, unknown> | undefined;
      if (props?.cwd && typeof props.cwd === 'string') return props.cwd;
      return process.cwd();
    },

    getClaudeScripts: (projectDir: string) => {
      if (!loadGlobalClaudeHooks && !loadLocalClaudeHooks) return {};
      return loadClaudeSettings(projectDir, {
        loadGlobal: loadGlobalClaudeHooks,
        loadLocal: loadLocalClaudeHooks,
      });
    },
  };
}

export function createEventResolver(
  userConfig: UserEventsConfig
): EventConfigResolver {
  const context = createContext(userConfig);
  return new DelegatingEventConfigResolver(context);
}

export function createToolResolver(
  userConfig: UserEventsConfig
): ToolConfigResolver {
  const context = createContext(userConfig);
  return new DefaultToolConfigResolver(context);
}
