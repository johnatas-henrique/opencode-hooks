import { describe, it, expect } from 'vitest';
import { getHandler } from '.opencode/plugins/features/events/events';

describe('getHandler', () => {
  it('should return handler for known event type', () => {
    const handler = getHandler('session.created');
    expect(handler).toBeDefined();
  });

  it('should return undefined for unknown event type', () => {
    const handler = getHandler('nonexistent.event');
    expect(handler).toBeUndefined();
  });

  it('should return handler for tool.execute.before event', () => {
    const handler = getHandler('tool.execute.before');
    expect(handler).toBeDefined();
  });

  it('should return handler for tool.execute.after event', () => {
    const handler = getHandler('tool.execute.after');
    expect(handler).toBeDefined();
  });

  it('should return handler for message event', () => {
    const handler = getHandler('session.created');
    expect(handler).toBeDefined();
  });
});
