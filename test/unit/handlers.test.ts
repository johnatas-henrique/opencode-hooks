import { handlers } from '../../.opencode/plugins/features/messages/default-handlers';

describe('handlers - truncate and formatValue', () => {
  it('buildMessage should truncate long strings', () => {
    const longValue = 'a'.repeat(2000);
    const event = {
      properties: {
        data: longValue,
      },
    };
    const message = handlers['session.created'].buildMessage(
      event as unknown as Record<string, unknown>
    );
    expect(message).toContain('...');
  });

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

describe('handlers - buildMessage', () => {
  describe('message events', () => {
    it('message.removed should handle full properties', () => {
      const event = { properties: { sessionID: 's1', messageID: 'm1' } };
      const message = handlers['message.removed'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('s1');
      expect(message).toContain('m1');
    });
  });

  describe('todo events', () => {
    it('todo.updated should show count when present', () => {
      const event = { properties: { count: 5 } };
      const message = handlers['todo.updated'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('count');
    });
  });
});

describe('handlers - all handlers have required fields', () => {
  const requiredFields = [
    'title',
    'variant',
    'duration',
    'defaultScript',
    'buildMessage',
  ];

  it.each(Object.keys(handlers))(
    'handler "%s" should have all required fields',
    (handlerName) => {
      const handler = handlers[handlerName];

      requiredFields.forEach((field) => {
        expect(handler).toHaveProperty(field);
      });
    }
  );

  it.each(Object.keys(handlers))(
    'handler "%s" should have valid variant',
    (handlerName) => {
      const handler = handlers[handlerName];
      const validVariants = ['success', 'warning', 'error', 'info'];

      expect(validVariants).toContain(handler.variant);
    }
  );

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
