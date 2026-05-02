import { handlers } from '.opencode/plugins/features/handlers';

describe('handlers - truncate and formatValue', () => {
  it('buildMessage should handle undefined values', () => {
    const event = {
      properties: {
        data: undefined,
      },
    };
    const message = handlers['session.created'].buildMessage(
      event as unknown as Record<string, unknown>
    );
    expect(message).toContain('unknown');
  });
});

describe('handlers - all handlers have required fields', () => {
  it.each(Object.keys(handlers))(
    'handler "%s" buildMessage should return string',
    (handlerName) => {
      const handler = handlers[handlerName];
      const mockEvent = {
        properties: {
          info: { id: 'test-id', title: 'Test' },
          sessionID: 'test-session',
          directory: '/test/dir',
          status: {},
          error: { name: 'TestError', data: { message: 'Test' } },
        },
      };
      const result = handler.buildMessage(
        mockEvent as unknown as Record<string, unknown>
      );

      expect(typeof result).toBe('string');
    }
  );
});
