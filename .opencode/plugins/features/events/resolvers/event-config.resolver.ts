import type { EventInput } from '.opencode/plugins/types/core';
import type {
  EventHandler,
  ConfigResolverContext,
  EventConfigResolver,
} from '.opencode/plugins/types/events';
import type { ResolvedEventConfig } from '.opencode/plugins/types/config';
import { ConfigBuilder } from '.opencode/plugins/features/events/resolvers/event-config-builder';

export class EventConfigResolverImpl implements EventConfigResolver {
  constructor(private context: ConfigResolverContext) {}

  public getHandler(eventType: string): EventHandler | undefined {
    return this.context.handlers[eventType];
  }

  public getDefaultScript(eventType: string): string {
    return `${eventType.replace(/\./g, '-')}.sh`;
  }

  resolve(
    eventType: string,
    input?: EventInput,
    output?: Record<string, unknown>
  ): ResolvedEventConfig {
    const builder = new ConfigBuilder(this.context, eventType, input, output);
    return builder.resolve();
  }
}
