import type { EventInput } from '.opencode/plugins/types/core';

export function normalizeInputForHandler(
  eventType: string,
  input: EventInput,
  output?: Record<string, unknown>
): Record<string, unknown> {
  if (eventType.startsWith('tool.execute.')) {
    return { input, output };
  }

  if (
    eventType === 'shell.env' ||
    eventType.startsWith('chat.') ||
    eventType.startsWith('experimental.') ||
    eventType.startsWith('permission.') ||
    eventType === 'command.execute.before'
  ) {
    return { properties: input, output };
  }

  if (input.properties && typeof input.properties === 'object') {
    return { properties: input.properties };
  }

  return { properties: input };
}
