import { handlers } from '../messages/default-handlers';
import { userConfig } from '../../config';
import { DISABLED_CONFIG } from '../../core/constants';
import type { ResolvedEventConfig } from '../../types/config';
import { createEventResolver, createToolResolver } from './context';

export { DISABLED_CONFIG };

const eventResolver = createEventResolver(userConfig);
const toolResolver = createToolResolver(userConfig);

export function normalizeInputForHandler(
  eventType: string,
  input: Record<string, unknown>,
  output?: Record<string, unknown>
): Record<string, unknown> {
  if (eventType.startsWith('tool.execute.')) {
    return { input, output };
  }

  if (eventType === 'shell.env') {
    return { properties: input, output };
  }

  if (eventType.startsWith('chat.') || eventType.startsWith('experimental.')) {
    return { properties: input, output };
  }

  if (eventType.startsWith('permission.')) {
    return { properties: input, output };
  }

  if (eventType === 'command.execute.before') {
    return { properties: input, output };
  }

  if (input.properties && typeof input.properties === 'object') {
    return { properties: input.properties };
  }

  return { properties: input };
}

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
