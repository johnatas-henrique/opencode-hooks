vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: vi.fn().mockResolvedValue(undefined),
}));

import { normalizeInputForHandler } from '../../.opencode/plugins/features/events/events';

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
