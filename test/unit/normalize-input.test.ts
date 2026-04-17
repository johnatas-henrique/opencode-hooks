vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: vi.fn().mockResolvedValue(undefined),
}));

import { normalizeInputForHandler } from '../../.opencode/plugins/features/events/events';

describe('normalizeInputForHandler', () => {
  describe('tool.execute.before/after events', () => {
    it('should return input and output for bash tool', () => {
      const input = {
        tool: 'bash',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { command: 'npm run build' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.input).toBeDefined();
      expect(result.input).toEqual(input);
    });

    it('should return input and output for read tool', () => {
      const input = {
        tool: 'read',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { filePath: '/home/user/file.ts' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.input).toEqual(input);
    });

    it('should return input and output for grep tool', () => {
      const input = {
        tool: 'grep',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { pattern: 'todoMessage.*unknown' },
      };

      const result = normalizeInputForHandler('tool.execute.before', input);

      expect(result.input).toEqual(input);
    });

    it('should return input and output for websearch tool', () => {
      const input = {
        tool: 'websearch',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { query: 'TypeScript hooks' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.input).toEqual(input);
    });

    it('should return input and output for task tool', () => {
      const input = {
        tool: 'task',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { name: 'explore', subagentType: 'general' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.input).toEqual(input);
    });

    it('should return input and output for skill tool', () => {
      const input = {
        tool: 'skill',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { name: 'commit' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.input).toEqual(input);
    });

    it('should return input and output for filesystem move', () => {
      const input = {
        tool: 'filesystem_move_file',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { source: '/src/a.ts', destination: '/dst/b.ts' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.input).toEqual(input);
    });
  });

  describe('session events', () => {
    it('should wrap session event input in properties', () => {
      const input = {
        sessionID: 'ses_123',
        status: 'idle',
      };

      const result = normalizeInputForHandler('session.idle', input);

      expect(result.properties).toBeDefined();
      expect(result.properties.sessionID).toBe('ses_123');
    });

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

  describe('chat events', () => {
    it('should wrap chat event input in properties', () => {
      const input = {
        sessionID: 'ses_123',
        agent: 'claude',
        model: { providerID: 'openai', modelID: 'gpt-4' },
      };

      const result = normalizeInputForHandler('chat.message', input);

      expect(result.properties.sessionID).toBe('ses_123');
      expect(result.properties.agent).toBe('claude');
    });
  });

  describe('shell.env event', () => {
    it('should wrap shell.env input in properties with output', () => {
      const input = {
        cwd: '/home/user',
        sessionID: 'ses_123',
        callID: 'call_456',
      };

      const result = normalizeInputForHandler('shell.env', input);

      expect(result.properties.cwd).toBe('/home/user');
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

      expect(result.properties.sessionID).toBe('ses_123');
      expect(result.properties.tool).toBe('bash');
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

      expect(result.properties.command).toBe('npm test');
      expect(result.properties.sessionID).toBe('ses_123');
    });
  });

  describe('tool.definition event', () => {
    it('should wrap tool.definition input in properties', () => {
      const input = {
        toolID: 'my-tool',
      };

      const result = normalizeInputForHandler('tool.definition', input);

      expect(result.properties.toolID).toBe('my-tool');
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

      expect(result.properties.sessionID).toBe('ses_123');
      expect(result.properties.messageID).toBe('msg_456');
      expect(result.properties.partID).toBe('part_789');
    });
  });

  describe('fallback for unknown events', () => {
    it('should return input wrapped in properties for unknown event types', () => {
      const input = {
        customField: 'value',
        another: 123,
      };

      const result = normalizeInputForHandler('unknown.event', input);

      expect(result.properties).toEqual(input);
    });

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
});
