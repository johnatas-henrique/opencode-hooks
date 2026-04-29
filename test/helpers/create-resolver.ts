import { createContext } from '../../.opencode/plugins/features/events/context';
import { EventConfigResolverImpl } from '../../.opencode/plugins/features/events/resolvers/event-config.resolver';
import { ToolConfigResolverImpl } from '../../.opencode/plugins/features/events/resolvers/tool-config.resolver';
import type {
  ConfigResolverContext,
  EventHandler,
} from '../../.opencode/plugins/types/events';
import type { UserEventsConfig } from '../../.opencode/plugins/types/config';

export interface TestResolvers {
  context: ConfigResolverContext;
  eventResolver: EventConfigResolverImpl;
  toolResolver: ToolConfigResolverImpl;
}

export function createResolvers(
  userConfig: UserEventsConfig,
  handlers?: Record<string, EventHandler>
): TestResolvers {
  const context = createContext(userConfig, handlers);
  return {
    context,
    eventResolver: new EventConfigResolverImpl(context),
    toolResolver: new ToolConfigResolverImpl(context),
  };
}
