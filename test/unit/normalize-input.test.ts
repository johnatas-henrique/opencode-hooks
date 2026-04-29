import { normalizeInputForHandler } from '../../.opencode/plugins/features/events/resolvers/normalize-input';

describe('normalizeInputForHandler (events.ts version)', () => {
  describe('shell.env coverage (line 11)', () => {
    it('should include output in shell.env result', () => {
      const input = { cwd: '/home/user' };
      const output = { env: { HOME: '/home' } };
      const result = normalizeInputForHandler('shell.env', input, output);
      expect((result.properties as Record<string, unknown>).cwd).toBe(
        '/home/user'
      );
      expect(result.output).toEqual(output);
    });
  });

  describe('command.execute.before (line 23)', () => {
    it('should include output in command result', () => {
      const input = { command: 'npm test' };
      const output = { before: true };
      const result = normalizeInputForHandler(
        'command.execute.before',
        input,
        output
      );
      expect((result.properties as Record<string, unknown>).command).toBe(
        'npm test'
      );
      expect(result.output).toEqual(output);
    });
  });

  describe('input.properties object extraction (line 26-27)', () => {
    it('should extract nested properties object', () => {
      const nestedProps = { key1: 'val1', key2: 42, nested: { deep: true } };
      const input = { properties: nestedProps, extraField: 'ignored' };
      const result = normalizeInputForHandler('custom.handler', input);
      expect(result).toEqual({ properties: nestedProps });
    });
  });
});

describe('normalizeInputForHandler', () => {
  describe('session events', () => {
    it('should preserve existing properties', () => {
      const input = {
        properties: {
          sessionID: 'ses_123',
          status: 'idle',
        },
      };

      const result = normalizeInputForHandler('session.idle', input);

      expect(result.properties).toEqual({
        sessionID: 'ses_123',
        status: 'idle',
      });
    });
  });

  describe('shell.env event', () => {
    it('should wrap shell.env input in properties', () => {
      const input = {
        cwd: '/home/user',
        sessionID: 'ses_123',
        callID: 'call_456',
      };

      const result = normalizeInputForHandler('shell.env', input);

      expect((result.properties as Record<string, unknown>).cwd).toBe(
        '/home/user'
      );
    });
  });

  describe('line 10 branch - exact match shell.env', () => {
    it('should cover line 10 when eventType exactly equals shell.env', () => {
      const input = { test: 'value' };
      const output = { result: 'output' };
      const result = normalizeInputForHandler('shell.env', input, output);
      expect(result).toHaveProperty('properties');
      expect(result).toHaveProperty('output');
    });
  });

  describe('line 22 branch - exact match command.execute.before', () => {
    it('should cover line 22 when eventType exactly equals command.execute.before', () => {
      const input = { command: 'ls' };
      const output = { files: [] };
      const result = normalizeInputForHandler(
        'command.execute.before',
        input,
        output
      );
      expect(result).toHaveProperty('properties');
    });
  });

  describe('permission.ask event', () => {
    it('should wrap permission input in properties', () => {
      const input = {
        sessionID: 'ses_123',
        tool: 'bash',
        someOtherField: 'value',
      };

      const result = normalizeInputForHandler('permission.ask', input);

      expect((result.properties as Record<string, unknown>).sessionID).toBe(
        'ses_123'
      );
      expect((result.properties as Record<string, unknown>).tool).toBe('bash');
    });
  });

  describe('command.execute.before event', () => {
    it('should wrap command input in properties', () => {
      const input = {
        command: 'npm test',
        sessionID: 'ses_123',
        arguments: '--coverage',
      };

      const result = normalizeInputForHandler('command.execute.before', input);

      expect((result.properties as Record<string, unknown>).command).toBe(
        'npm test'
      );
      expect((result.properties as Record<string, unknown>).sessionID).toBe(
        'ses_123'
      );
    });
  });

  describe('tool.definition event', () => {
    it('should wrap tool.definition input in properties', () => {
      const input = {
        toolID: 'my-tool',
      };

      const result = normalizeInputForHandler('tool.definition', input);

      expect((result.properties as Record<string, unknown>).toolID).toBe(
        'my-tool'
      );
    });
  });

  describe('experimental.text.complete event', () => {
    it('should wrap experimental input in properties', () => {
      const input = {
        sessionID: 'ses_123',
        messageID: 'msg_456',
        partID: 'part_789',
      };

      const result = normalizeInputForHandler(
        'experimental.text.complete',
        input
      );

      expect((result.properties as Record<string, unknown>).sessionID).toBe(
        'ses_123'
      );
      expect((result.properties as Record<string, unknown>).messageID).toBe(
        'msg_456'
      );
      expect((result.properties as Record<string, unknown>).partID).toBe(
        'part_789'
      );
    });
  });

  describe('chat events (line 14 branch)', () => {
    it('should handle chat.message event', () => {
      const input = { sessionID: 'ses_123', message: 'hello' };
      const result = normalizeInputForHandler('chat.message', input);
      expect(result).toEqual({ properties: input });
    });

    it('should handle chat.conversation event', () => {
      const input = { sessionID: 'ses_123', conversationID: 'conv_1' };
      const result = normalizeInputForHandler('chat.conversation', input);
      expect(result).toEqual({ properties: input });
    });

    it('should handle chat.update event', () => {
      const input = { sessionID: 'ses_123', status: 'updated' };
      const result = normalizeInputForHandler('chat.update', input);
      expect(result).toEqual({ properties: input });
    });
  });

  describe('experimental events (line 14 branch)', () => {
    it('should handle experimental.text.complete', () => {
      const input = { sessionID: 'ses_123', messageID: 'msg_1' };
      const result = normalizeInputForHandler(
        'experimental.text.complete',
        input
      );
      expect(result.properties).toEqual(input);
    });

    it('should handle experimental.audio.start', () => {
      const input = { sessionID: 'ses_123', streamID: 'stream_1' };
      const result = normalizeInputForHandler(
        'experimental.audio.start',
        input
      );
      expect(result.properties).toEqual(input);
    });
  });

  describe('permission events with sub-type (line 18 branch)', () => {
    it('should handle permission.check', () => {
      const input = { tool: 'read', level: 'medium' };
      const result = normalizeInputForHandler('permission.check', input);
      expect(result).toEqual({ properties: input });
    });

    it('should handle permission-response', () => {
      const input = { tool: 'bash', granted: true };
      const result = normalizeInputForHandler('permission-response', input);
      expect(result).toEqual({ properties: input });
    });
  });

  describe('tool.execute events (line 6 branch)', () => {
    it('should return input/output for tool.execute.before', () => {
      const input = { tool: 'read', filePath: '/test' };
      const output = { content: 'test' };
      const result = normalizeInputForHandler(
        'tool.execute.before',
        input,
        output
      );
      expect(result).toEqual({ input, output });
    });

    it('should return input/output for tool.execute.after', () => {
      const input = { tool: 'read', filePath: '/test' };
      const output = { content: 'test' };
      const result = normalizeInputForHandler(
        'tool.execute.after',
        input,
        output
      );
      expect(result).toEqual({ input, output });
    });
  });

  describe('fallback for unknown events', () => {
    it('should preserve input for tool events', () => {
      const input = {
        tool: 'bash',
        sessionID: 'ses_123',
        extraField: 'extraValue',
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.input).toEqual(input);
    });
  });

  describe('custom event with properties', () => {
    it('should return properties when eventType is custom with properties object', () => {
      const input = {
        properties: { customField: 'value', nested: { key: 'val' } },
        otherField: 'test',
      };

      const result = normalizeInputForHandler('custom.event.type', input);

      expect(result).toEqual({
        properties: { customField: 'value', nested: { key: 'val' } },
      });
    });

    it('should cover typeof branch when properties is truthy non-object (line 27)', () => {
      const input = Object.assign(Object.create(null), {
        properties: 'not-an-object-string',
        otherField: 'test',
      });

      const result = normalizeInputForHandler('custom.event', input);

      expect(result).toEqual({ properties: input });
    });

    it('should extract nested properties object for unknown events', () => {
      const nestedProps = { key1: 'value1', key2: 42 };
      const input = {
        properties: nestedProps,
        extra: 'field',
      };

      const result = normalizeInputForHandler('custom.handler', input);

      expect(result).toEqual({ properties: nestedProps });
    });

    it('should handle input without properties (fallback to line 30)', () => {
      const input = { param1: 'val1', param2: 'val2' };
      const result = normalizeInputForHandler('custom.event', input);
      expect(result).toEqual({ properties: input });
    });

    it('should handle input with empty properties object', () => {
      const input = { properties: {}, other: 'field' };
      const result = normalizeInputForHandler('custom.event', input);
      expect(result).toEqual({ properties: {} });
    });
  });
});
