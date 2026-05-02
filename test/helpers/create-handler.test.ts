import { describe, it, expect } from 'vitest';
import { createHandler, createHandlers } from 'test/helpers/create-handler';

describe('createHandler', () => {
  it('should use default buildMessage when no override provided', () => {
    const handler = createHandler({});
    const message = handler.buildMessage({ test: 'data' });
    expect(message).toBe('test message');
  });

  it('should pass all override properties to each handler', () => {
    const handlers = createHandlers({
      'tool.execute.before': {
        title: 'Custom',
        variant: 'warning',
        duration: 4000,
        defaultScript: 'custom.sh',
        allowedFields: ['stdout'],
        defaultTemplate: 'test',
      },
    });
    const handler = handlers['tool.execute.before'];
    expect(handler.title).toBe('Custom');
    expect(handler.variant).toBe('warning');
    expect(handler.duration).toBe(4000);
    expect(handler.defaultScript).toBe('custom.sh');
    expect(handler.allowedFields).toEqual(['stdout']);
    expect(handler.defaultTemplate).toBe('test');
  });
});
