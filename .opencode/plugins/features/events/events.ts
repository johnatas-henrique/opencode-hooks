import { handlers } from '../messages/default-handlers';
import { userConfig } from '../../config';
import { DISABLED_CONFIG } from '../../core/constants';
import type { ResolvedEventConfig } from '../../types/config';
import { createEventResolver, createToolResolver } from './context';

export { DISABLED_CONFIG };

const eventResolver = createEventResolver(userConfig);
const toolResolver = createToolResolver(userConfig);

export function getHandler(eventType: string) {
  return handlers[eventType];
}

export function getToolHandler(toolName: string, toolEventType?: string) {
  if (toolEventType?.includes('.before')) {
    return handlers[`tool.execute.before.${toolName}`];
  }
  if (toolEventType?.includes('.after')) {
    return handlers[`tool.execute.after.${toolName}`];
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
