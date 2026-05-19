import type { EventHandler } from '.opencode/plugins/types/events';
import type { HandlerConfig } from '.opencode/plugins/types/messages';

export function createHandler(config: HandlerConfig): EventHandler {
  return {
    title: config.title,
    variant: config.variant,
    duration: config.duration,
    defaultScript: config.defaultScript,
    buildMessage: config.buildMessage,
    allowedFields: config.allowedFields,
    defaultTemplate: config.defaultTemplate,
  };
}
