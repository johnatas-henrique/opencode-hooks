import type { EventHandler } from '../../.opencode/plugins/features/messages/default-handlers';

type BuildMessageFn = (
  event: Record<string, unknown>,
  allowedFields?: string[]
) => string;

interface HandlerConfig {
  title?: string;
  variant?: EventHandler['variant'];
  duration?: number;
  defaultScript?: string;
  buildMessage?: BuildMessageFn;
  allowedFields?: string[];
  defaultTemplate?: string;
}

const defaultHandler: HandlerConfig = {
  title: '====TEST====',
  variant: 'info',
  duration: 2000,
  defaultScript: 'test.sh',
  buildMessage: () => 'test message',
};

export function createHandler(overrides: HandlerConfig = {}): EventHandler {
  const config = { ...defaultHandler, ...overrides };
  return {
    title: config.title!,
    variant: config.variant!,
    duration: config.duration!,
    defaultScript: config.defaultScript!,
    buildMessage: config.buildMessage!,
    allowedFields: config.allowedFields,
    defaultTemplate: config.defaultTemplate,
  };
}

export function createHandlers(
  events: Record<string, HandlerConfig>
): Record<string, EventHandler> {
  return Object.fromEntries(
    Object.entries(events).map(([key, config]) => [key, createHandler(config)])
  );
}
