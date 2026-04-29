import {
  buildKeysMessage,
  buildKeysMessageSimple,
} from '../../.opencode/plugins/features/message-formatter/build-keys-message';

describe('buildKeysMessage with allowedFields', () => {
  it('should use properties. prefix to get value from properties', () => {
    const event = { properties: { duration: 1000, status: 'ok' } };
    const message = buildKeysMessage(event, ['properties.duration']);
    expect(message).toContain('properties.duration:');
    expect(message).toContain('1000');
  });

  it('should handle multiple allowed fields', () => {
    const event = {
      input: { name: 'John' },
      output: { result: 'success' },
    };
    const message = buildKeysMessage(event, ['input.name', 'output.result']);
    expect(message).toContain('input.name:');
    expect(message).toContain('output.result:');
  });

  it('should handle null args', () => {
    const event = { input: { args: null } };
    const message = buildKeysMessage(event);
    expect(message).toBeDefined();
  });

  it('should handle null properties', () => {
    const event = { properties: null as unknown as Record<string, unknown> };
    const message = buildKeysMessageSimple(event);
    expect(message).toContain('Time:');
  });

  it('should cover line 104 in buildKeysMessageSimple', () => {
    const event = { properties: { key: 'value' } };
    const message = buildKeysMessageSimple(event, ['key']);
    expect(message).toContain('key:');
    expect(message).toContain('value');
  });

  it('should cover input.args branch (lines 23-26)', () => {
    const event = { input: { args: { port: '3000', host: 'localhost' } } };
    const message = buildKeysMessage(event);
    expect(message).toContain('input.args.port:');
    expect(message).toContain('input.args.host:');
  });

  it('should cover input without args branch (lines 32-34)', () => {
    const event = { input: { name: 'test' }, output: { result: 'ok' } };
    const message = buildKeysMessage(event);
    expect(message).toContain('output.result:');
  });

  it('should cover unprefixed field lookup (line 48)', () => {
    const event = {
      input: { status: 'active' },
      output: { status: 'done' },
      properties: { status: 'final' },
    };
    const message = buildKeysMessage(event, ['status']);
    expect(message).toContain('status:');
  });

  it('should cover unprefixed field lookup fallback chain (lines 48-54)', () => {
    const event = {
      input: {},
      output: { status: 'done' },
      properties: {},
    };
    const message = buildKeysMessage(event, ['status']);
    expect(message).toContain('status:');
    expect(message).toContain('done');
  });

  it('should cover output branch without input (lines 31-36)', () => {
    const event = { output: { result: 'success', data: 'test' } };
    const message = buildKeysMessage(event);
    expect(message).toContain('output.result:');
    expect(message).toContain('output.data:');
  });

  it('should cover field lookup value is undefined (lines 54-56)', () => {
    const event = {
      input: null as unknown as Record<string, unknown>,
      output: {},
      properties: {},
    };
    const message = buildKeysMessage(event, ['nonexistent']);
    expect(message).toBeDefined();
  });
});
