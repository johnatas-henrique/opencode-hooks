import { normalizeInputForHandler } from '.opencode/plugins/features/events/resolvers/normalize-input';

describe('normalizeInputForHandler', () => {
  describe('line 10 branch - exact match shell.env', () => {
    it('should cover line 10 when eventType exactly equals shell.env', () => {
      const input = { test: 'value' };
      const output = { result: 'output' };
      const result = normalizeInputForHandler('shell.env', input, output);
      expect(result).toHaveProperty('properties');
      expect(result).toHaveProperty('output');
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

  describe('experimental events (line 14 branch)', () => {
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
  });

  describe('custom event with properties', () => {
    it('should handle input with empty properties object', () => {
      const input = { properties: {}, other: 'field' };
      const result = normalizeInputForHandler('custom.event', input);
      expect(result).toEqual({ properties: {} });
    });
  });
});
