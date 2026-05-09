import { userConfig } from '.opencode/plugins/config/settings';
import type { ResolvedEventConfig } from '.opencode/plugins/types/config';
import type { EventInput } from '.opencode/plugins/types/core';
import {
  createEventResolver,
  createToolResolver,
  setOnUnknownEvent,
} from '.opencode/plugins/features/events/context';

export { setOnUnknownEvent };

const eventResolver = createEventResolver(userConfig);
const toolResolver = createToolResolver(userConfig);

export function resolveEventConfig(
  eventType: string,
  input?: EventInput,
  output?: Record<string, unknown>
): ResolvedEventConfig {
  return eventResolver.resolve(eventType, input, output);
}

export function resolveToolConfig(
  toolEventType: string,
  toolName: string,
  input?: EventInput,
  output?: Record<string, unknown>
): ResolvedEventConfig {
  return toolResolver.resolve(toolEventType, toolName, input, output);
}
