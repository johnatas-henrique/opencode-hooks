import { userConfig } from '.opencode/plugins/config/settings';
import type { ResolvedEventConfig } from '.opencode/plugins/types/config';
import {
  createEventResolver,
  createToolResolver,
} from '.opencode/plugins/features/events/context';

const eventResolver = createEventResolver(userConfig);
const toolResolver = createToolResolver(userConfig);

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
