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
});
