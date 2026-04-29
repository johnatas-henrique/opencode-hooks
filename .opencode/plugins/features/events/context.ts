import type { UserEventsConfig } from '../../types/config';
import type {
  EventHandler,
  ConfigResolverContext,
  ResolverFactory,
  EventConfigResolver,
  ToolConfigResolver,
} from '../../types/events';
import { EventConfigResolverImpl } from './resolvers/event-config.resolver';
import { ToolConfigResolverImpl } from './resolvers/tool-config.resolver';
import { handlers } from '../handlers';

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
