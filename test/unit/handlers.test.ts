import { handlers } from '../../.opencode/plugins/helpers/default-handlers';

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

  it('buildMessage should handle null values', () => {
    const event = {
      properties: {
        data: null,
      },
    };
    const message = handlers['session.created'].buildMessage(
      event as unknown as Record<string, unknown>
    );
    expect(message).toContain('unknown');
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

      const message = handlers['session.created'].buildMessage(
        event as unknown as Record<string, unknown>
      );

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

      const message = handlers['session.error'].buildMessage(
        event as unknown as Record<string, unknown>
      );

      expect(message).toContain('error-session-456');
      expect(message).toContain('ApiError');
      expect(message).toContain('Connection refused');
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
        event as unknown as Record<string, unknown>
      );

      expect(message).toContain('/path/to/project');
    });
  });

  describe('message events', () => {
    it('message.removed should handle full properties', () => {
      const event = { properties: { sessionID: 's1', messageID: 'm1' } };
      const message = handlers['message.removed'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('s1');
      expect(message).toContain('m1');
    });

    it('message.updated should handle full properties', () => {
      const event = { properties: { sessionID: 's2', messageID: 'm2' } };
      const message = handlers['message.updated'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('s2');
      expect(message).toContain('m2');
    });
  });

  describe('tool events', () => {
    it('tool.execute.before should show all properties', () => {
      const event = {
        input: {
          sessionID: 'ses_123',
          tool: 'bash',
          callID: 'call_456',
          args: { command: 'ls -la' },
        },
      };
      const message = handlers['tool.execute.before'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('sessionID');
      expect(message).toContain('tool');
      expect(message).toContain('bash');
      expect(message).toContain('Time:');
    });

    it('tool.execute.after should show input and output', () => {
      const event = {
        input: {
          sessionID: 'ses_123',
          tool: 'bash',
        },
        output: {
          result: 'success',
        },
      };
      const message = handlers['tool.execute.after'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('sessionID');
      expect(message).toContain('output');
      expect(message).toContain('Time:');
    });
  });

  describe('shell.env', () => {
    it('should show properties and output', () => {
      const event = {
        properties: { cwd: '/home/user', sessionID: 's1' },
        output: { env: { PATH: '/usr/bin' } },
      };
      const message = handlers['shell.env'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('cwd');
      expect(message).toContain('Time:');
    });
  });

  describe('permission events', () => {
    it('permission.ask should show properties', () => {
      const event = {
        properties: { sessionID: 's1', tool: 'bash' },
      };
      const message = handlers['permission.ask'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('sessionID');
      expect(message).toContain('tool');
    });
  });

  describe('server.connected', () => {
    it('should show url when present', () => {
      const event = {
        properties: { url: 'https://api.example.com' },
      };
      const message = handlers['server.connected'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('url');
    });
  });

  describe('command events', () => {
    it('command.executed should show command when present', () => {
      const event = {
        properties: { command: 'npm run build' },
      };
      const message = handlers['command.executed'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('command');
    });
  });

  describe('LSP events', () => {
    it('lsp.client.diagnostics should count diagnostics', () => {
      const event = { properties: { uri: 'file.ts', diagnostics: [{}, {}] } };
      const message = handlers['lsp.client.diagnostics'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('uri');
      expect(message).toContain('diagnostics');
    });
  });

  describe('installation events', () => {
    it('installation.updated should show version when present', () => {
      const event = { properties: { version: '1.2.3' } };
      const message = handlers['installation.updated'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('version');
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

  describe('TUI events', () => {
    it('tui.prompt.append should show sessionID when present', () => {
      const event = { properties: { sessionID: 's1' } };
      const message = handlers['tui.prompt.append'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('sessionID');
    });

    it('tui.command.execute should show command when present', () => {
      const event = { properties: { command: 'ls' } };
      const message = handlers['tui.command.execute'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('command');
    });

    it('tui.toast.show should show title when present', () => {
      const event = { properties: { title: 'Test Toast' } };
      const message = handlers['tui.toast.show'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('title');
    });
  });

  describe('experimental events', () => {
    it('experimental.session.compacting should show sessionID when present', () => {
      const event = { properties: { sessionID: 's1' } };
      const message = handlers['experimental.session.compacting'].buildMessage(
        event as unknown as Record<string, unknown>
      );
      expect(message).toContain('sessionID');
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
