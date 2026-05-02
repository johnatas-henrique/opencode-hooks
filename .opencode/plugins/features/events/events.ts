import { handlers } from '.opencode/plugins/features/handlers';
import { userConfig } from '.opencode/plugins/config/settings';
import type { ResolvedEventConfig } from '.opencode/plugins/types/config';
import {
  createEventResolver,
  createToolResolver,
} from '.opencode/plugins/features/events/context';

const eventResolver = createEventResolver(userConfig);
const toolResolver = createToolResolver(userConfig);

export function getHandler(eventType: string) {
  return handlers[eventType];
}

export function getToolHandler(
  toolName: string,
  toolEventType?: string,
  customHandlers?: Record<string, unknown>
) {
  const h = customHandlers ?? handlers;
  if (toolEventType?.includes('.before')) {
    return h[`tool.execute.before.${toolName}`];
  }
  if (toolEventType?.includes('.after')) {
    return h[`tool.execute.after.${toolName}`];
  }
  return undefined;
}

export function resolveEventConfig(
  eventType: string,
  input?: Record<string, unknown>,
  output?: Record<string, unknown>
): ResolvedEventConfig {
  return eventResolver.resolve(eventType, input, output);
}

export function resolveToolConfig(
  toolEventType: string,
  toolName: string,
  input?: Record<string, unknown>,
  output?: Record<string, unknown>
): ResolvedEventConfig {
  return toolResolver.resolve(toolEventType, toolName, input, output);
}
