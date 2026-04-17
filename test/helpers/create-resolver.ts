import { createContext } from '../../.opencode/plugins/features/events/context';
import { EventConfigResolverImpl } from '../../.opencode/plugins/features/events/resolvers/event-config.resolver';
import { ToolConfigResolverImpl } from '../../.opencode/plugins/features/events/resolvers/tool-config.resolver';
import type { ConfigResolverContext } from '../../.opencode/plugins/features/events/interfaces';
import type { UserEventsConfig } from '../../.opencode/plugins/types/config';
import type { EventHandler } from '../../.opencode/plugins/features/messages/default-handlers';

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
