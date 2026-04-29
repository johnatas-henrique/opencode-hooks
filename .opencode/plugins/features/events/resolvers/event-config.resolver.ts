import type {
  EventHandler,
  ConfigResolverContext,
  EventConfigResolver,
} from '../../../types/events';
import type { ResolvedEventConfig } from '../../../types/config';
import { ConfigBuilder } from './event-config-builder';

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
    input?: Record<string, unknown>,
    output?: Record<string, unknown>
  ): ResolvedEventConfig {
    const builder = new ConfigBuilder(this.context, eventType, input, output);
    return builder.resolve();
  }
}
