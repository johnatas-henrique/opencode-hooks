import type { UserEventsConfig } from '.opencode/plugins/types/config';
import type { EventInput } from '.opencode/plugins/types/core';
import type {
  EventHandler,
  ConfigResolverContext,
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
    getEventConfig: (eventType: string) =>
      userConfig.events[eventType as keyof typeof userConfig.events],
    getToolConfigs: (toolEventType: string) =>
      userConfig.tools[toolEventType as keyof typeof userConfig.tools],
    getProjectDir: (input?: EventInput) => {
      const props = input?.properties as Record<string, unknown> | undefined;
      if (props?.cwd && typeof props.cwd === 'string') {
        return props.cwd;
      }
      try {
        return process.cwd();
      } catch {
        return '/home/johnatas/projects/opencode-hooks';
      }
    },
    getClaudeScripts: (projectDir: string) => {
      const { loadGlobalClaudeHooks, loadLocalClaudeHooks } =
        userConfig.loadClaudeHookSettings;
      if (!loadGlobalClaudeHooks && !loadLocalClaudeHooks) {
        return { global: {}, local: {}, all: {} };
      }
      const result = loadClaudeSettings(projectDir, {
        loadGlobal: loadGlobalClaudeHooks,
        loadLocal: loadLocalClaudeHooks,
      });
      return { global: result.global, local: result.local, all: result.all };
    },
    get claudeScripts() {
      const { loadGlobalClaudeHooks, loadLocalClaudeHooks } =
        userConfig.loadClaudeHookSettings;
      if (!loadGlobalClaudeHooks && !loadLocalClaudeHooks) {
        return { global: {}, local: {}, all: {} };
      }
      try {
        const projectDir = process.cwd();
        const result = loadClaudeSettings(projectDir, {
          loadGlobal: loadGlobalClaudeHooks,
          loadLocal: loadLocalClaudeHooks,
        });
        return { global: result.global, local: result.local, all: result.all };
      } catch {
        return { global: {}, local: {}, all: {} };
      }
    },
    get claudeUnsupported() {
      return [];
    },
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
