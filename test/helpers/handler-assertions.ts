import { expect } from 'vitest';
import type { EventHandler } from '.opencode/plugins/types/events';

export function expectHandlerProps(
  handlers: Record<string, EventHandler>,
  keys: readonly string[]
) {
  for (const key of keys) {
    const handler = handlers[key];
    expect(handler).toHaveProperty('title');
    expect(handler).toHaveProperty('variant');
    expect(handler).toHaveProperty('duration');
    expect(handler).toHaveProperty('defaultScript');
    expect(handler).toHaveProperty('buildMessage');
    expect(typeof handler.buildMessage).toBe('function');
  }
}
