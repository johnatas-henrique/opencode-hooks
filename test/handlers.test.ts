import { handlers } from '../.opencode/plugins/helpers/default-handlers';

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

  describe('message events', () => {
    it('message.part.removed should handle missing sessionID', () => {
      const event = { properties: {} };
      const message = handlers['message.part.removed'].buildMessage(
        event as any
      );
      expect(message).toContain('unknown');
    });

    it('message.part.updated should handle missing messageID', () => {
      const event = { properties: {} };
      const message = handlers['message.part.updated'].buildMessage(
        event as any
      );
      expect(message).toContain('unknown');
    });

    it('message.removed should handle full properties', () => {
      const event = { properties: { sessionID: 's1', messageID: 'm1' } };
      const message = handlers['message.removed'].buildMessage(event as any);
      expect(message).toContain('s1');
      expect(message).toContain('m1');
    });

    it('message.updated should handle full properties', () => {
      const event = { properties: { sessionID: 's2', messageID: 'm2' } };
      const message = handlers['message.updated'].buildMessage(event as any);
      expect(message).toContain('s2');
      expect(message).toContain('m2');
    });
  });

  describe('tool events', () => {
    it('tool.execute.before should handle missing tool', () => {
      const event = { properties: {} };
      const message = handlers['tool.execute.before'].buildMessage(
        event as any
      );
      expect(message).toContain('unknown');
    });

    it('tool.execute.after should handle missing sessionID', () => {
      const event = { properties: {} };
      const message = handlers['tool.execute.after'].buildMessage(event as any);
      expect(message).toContain('unknown');
    });
  });

  describe('file events', () => {
    it('file.edited should handle missing path', () => {
      const event = { properties: {} };
      const message = handlers['file.edited'].buildMessage(event as any);
      expect(message).toContain('unknown');
    });

    it('file.watcher.updated should handle missing properties', () => {
      const event = { properties: {} };
      const message = handlers['file.watcher.updated'].buildMessage(
        event as any
      );
      expect(message).toContain('unknown');
    });
  });

  describe('permission events', () => {
    it('permission.asked should handle missing permission', () => {
      const event = { properties: {} };
      const message = handlers['permission.asked'].buildMessage(event as any);
      expect(message).toContain('unknown');
    });

    it('permission.replied should handle missing decision', () => {
      const event = { properties: {} };
      const message = handlers['permission.replied'].buildMessage(event as any);
      expect(message).toContain('unknown');
    });
  });

  describe('server events', () => {
    it('server.connected should handle missing url', () => {
      const event = { properties: {} };
      const message = handlers['server.connected'].buildMessage(event as any);
      expect(message).toContain('unknown');
    });
  });

  describe('command events', () => {
    it('command.executed should handle missing command', () => {
      const event = { properties: {} };
      const message = handlers['command.executed'].buildMessage(event as any);
      expect(message).toContain('unknown');
    });
  });

  describe('LSP events', () => {
    it('lsp.client.diagnostics should handle missing uri', () => {
      const event = { properties: {} };
      const message = handlers['lsp.client.diagnostics'].buildMessage(
        event as any
      );
      expect(message).toContain('unknown');
    });

    it('lsp.client.diagnostics should count diagnostics', () => {
      const event = { properties: { uri: 'file.ts', diagnostics: [{}, {}] } };
      const message = handlers['lsp.client.diagnostics'].buildMessage(
        event as any
      );
      expect(message).toContain('2');
    });

    it('lsp.updated should handle missing serverID', () => {
      const event = { properties: {} };
      const message = handlers['lsp.updated'].buildMessage(event as any);
      expect(message).toContain('unknown');
    });
  });

  describe('installation events', () => {
    it('installation.updated should handle missing version', () => {
      const event = { properties: {} };
      const message = handlers['installation.updated'].buildMessage(
        event as any
      );
      expect(message).toContain('unknown');
    });
  });

  describe('todo events', () => {
    it('todo.updated should handle missing count', () => {
      const event = { properties: {} };
      const message = handlers['todo.updated'].buildMessage(event as any);
      expect(message).toContain('0');
    });
  });

  describe('shell events', () => {
    it('shell.env should handle missing cwd', () => {
      const event = { properties: {} };
      const message = handlers['shell.env'].buildMessage(event as any);
      expect(message).toContain('unknown');
    });
  });

  describe('TUI events', () => {
    it('tui.prompt.append should handle missing sessionID', () => {
      const event = { properties: {} };
      const message = handlers['tui.prompt.append'].buildMessage(event as any);
      expect(message).toContain('unknown');
    });

    it('tui.command.execute should handle missing command', () => {
      const event = { properties: {} };
      const message = handlers['tui.command.execute'].buildMessage(
        event as any
      );
      expect(message).toContain('unknown');
    });

    it('tui.toast.show should handle missing title', () => {
      const event = { properties: {} };
      const message = handlers['tui.toast.show'].buildMessage(event as any);
      expect(message).toContain('unknown');
    });
  });

  describe('experimental events', () => {
    it('experimental.session.compacting should handle missing sessionID', () => {
      const event = { properties: {} };
      const message = handlers['experimental.session.compacting'].buildMessage(
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
