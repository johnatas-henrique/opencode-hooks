import { normalizeInputForHandler } from '../../.opencode/plugins/helpers/events';

describe('normalizeInputForHandler', () => {
  describe('tool.execute.before/after events', () => {
    it('should normalize bash tool input', () => {
      const input = {
        tool: 'bash',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { command: 'npm run build' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.properties.sessionID).toBe('ses_123');
      expect(result.properties.tool.input).toBe('npm run build');
      expect(result.properties.command).toBe('npm run build');
    });

    it('should normalize read tool input with path', () => {
      const input = {
        tool: 'read',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { filePath: '/home/user/file.ts' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.properties.sessionID).toBe('ses_123');
      expect(result.properties.tool).toBe('read');
      expect(result.properties.path).toBe('/home/user/file.ts');
    });

    it('should normalize grep tool input with pattern', () => {
      const input = {
        tool: 'grep',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { pattern: 'todoMessage.*unknown' },
      };

      const result = normalizeInputForHandler('tool.execute.before', input);

      expect(result.properties.sessionID).toBe('ses_123');
      expect(result.properties.tool.input).toBe('todoMessage.*unknown');
      expect(result.properties.pattern).toBe('todoMessage.*unknown');
    });

    it('should normalize websearch tool input', () => {
      const input = {
        tool: 'websearch',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { query: 'TypeScript hooks' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.properties.sessionID).toBe('ses_123');
      expect(result.properties.tool.input).toBe('TypeScript hooks');
      expect(result.properties.query).toBe('TypeScript hooks');
    });

    it('should normalize task tool with subagentType', () => {
      const input = {
        tool: 'task',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { name: 'explore', subagentType: 'general' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.properties.sessionID).toBe('ses_123');
      expect(result.properties.tool).toBe('task');
      expect(result.properties.subagentType).toBe('general');
      expect(result.properties.skillName).toBeUndefined();
    });

    it('should normalize skill tool with name', () => {
      const input = {
        tool: 'skill',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { name: 'commit' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.properties.sessionID).toBe('ses_123');
      expect(result.properties.tool.input).toBe('commit');
      expect(result.properties.skillName).toBe('commit');
    });

    it('should normalize filesystem move with source and destination', () => {
      const input = {
        tool: 'filesystem_move_file',
        sessionID: 'ses_123',
        callID: 'call_456',
        args: { source: '/src/a.ts', destination: '/dst/b.ts' },
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.properties.source).toBe('/src/a.ts');
      expect(result.properties.destination).toBe('/dst/b.ts');
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
    it('should extract cwd from shell.env input', () => {
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
    it('should map sessionID and tool from permission input', () => {
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
    it('should map command and sessionID', () => {
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
    it('should not have toolID in properties for unknown event types (fallback)', () => {
      const input = {
        toolID: 'my-tool',
      };

      const result = normalizeInputForHandler('tool.definition', input);

      expect(result.properties.toolID).toBeUndefined();
    });
  });

  describe('experimental.text.complete event', () => {
    it('should map sessionID, messageID and partID', () => {
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
    it('should return input as-is for unknown event types', () => {
      const input = {
        customField: 'value',
        another: 123,
      };

      const result = normalizeInputForHandler('unknown.event', input);

      expect(result).toEqual(input);
    });

    it('should preserve root fields alongside properties', () => {
      const input = {
        tool: 'bash',
        sessionID: 'ses_123',
        extraField: 'extraValue',
      };

      const result = normalizeInputForHandler('tool.execute.after', input);

      expect(result.properties.sessionID).toBe('ses_123');
      expect(result.extraField).toBe('extraValue');
    });
  });
});
