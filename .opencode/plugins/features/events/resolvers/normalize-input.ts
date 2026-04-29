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
