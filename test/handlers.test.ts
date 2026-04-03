import { handlers } from '../.opencode/plugins/helpers/handlers';

describe('handlers - buildMessage', () => {
  describe('session.created', () => {
    it('should contain session ID and title', () => {
      const event = {
        properties: {
          info: {
            id: 'test-session-123',
            title: 'My Session',
          },
        },
      };

      const message = handlers['session.created'].buildMessage(event as any);

      expect(message).toContain('test-session-123');
      expect(message).toContain('My Session');
    });
  });

  describe('session.error', () => {
    it('should contain error name and message', () => {
      const event = {
        properties: {
          sessionID: 'error-session-456',
          error: {
            name: 'ApiError',
            data: { message: 'Connection refused' },
          },
        },
      };

      const message = handlers['session.error'].buildMessage(event as any);

      expect(message).toContain('error-session-456');
      expect(message).toContain('ApiError');
      expect(message).toContain('Connection refused');
    });

    it('should show Unknown error fallback when error is undefined', () => {
      const event = {
        properties: {
          sessionID: 'error-session-789',
          error: undefined,
        },
      };

      const message = handlers['session.error'].buildMessage(event as any);

      expect(message).toContain('Unknown error');
      expect(message).toContain('Unknown message');
    });

    it('should show Unknown message fallback when data is missing', () => {
      const event = {
        properties: {
          sessionID: 'error-session-abc',
          error: { name: 'SomeError' },
        },
      };

      const message = handlers['session.error'].buildMessage(event as any);

      expect(message).toContain('SomeError');
      expect(message).toContain('Unknown message');
    });
  });

  describe('server.instance.disposed', () => {
    it('should contain directory', () => {
      const event = {
        properties: {
          directory: '/path/to/project',
        },
      };

      const message = handlers['server.instance.disposed'].buildMessage(
        event as any
      );

      expect(message).toContain('/path/to/project');
    });

    it('should show unknown fallback when directory is missing', () => {
      const event = {
        properties: {},
      };

      const message = handlers['server.instance.disposed'].buildMessage(
        event as any
      );

      expect(message).toContain('unknown');
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
      const result = handler.buildMessage(mockEvent as any);

      expect(typeof result).toBe('string');
    }
  );
});
