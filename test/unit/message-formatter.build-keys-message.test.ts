import { buildKeysMessage } from '../../.opencode/plugins/features/message-formatter/build-keys-message';

describe('buildKeysMessage with allowedFields', () => {
  it('should use input. prefix to get value from input', () => {
    const event = { input: { name: 'John', email: 'john@example.com' } };
    const message = buildKeysMessage(event, ['input.name']);
    expect(message).toContain('input.name:');
    expect(message).toContain('John');
  });

  it('should use output. prefix to get value from output', () => {
    const event = { output: { result: 'success', code: 200 } };
    const message = buildKeysMessage(event, ['output.result']);
    expect(message).toContain('output.result:');
    expect(message).toContain('success');
  });

  it('should use properties. prefix to get value from properties', () => {
    const event = { properties: { duration: 1000, status: 'ok' } };
    const message = buildKeysMessage(event, ['properties.duration']);
    expect(message).toContain('properties.duration:');
    expect(message).toContain('1000');
  });

  it('should search all sources when no prefix is provided', () => {
    const event = {
      input: { name: 'John' },
      output: { name: 'Jane' },
      properties: { name: 'Bob' },
    };
    const message = buildKeysMessage(event, ['name']);
    expect(message).toContain('name:');
  });

  it('should not include undefined values', () => {
    const event = { input: { name: 'John' } };
    const message = buildKeysMessage(event, ['input.name', 'input.email']);
    expect(message).toContain('input.name:');
    expect(message).not.toContain('input.email');
  });

  it('should handle nested input paths', () => {
    const event = { input: { user: { profile: { name: 'John' } } } };
    const message = buildKeysMessage(event, ['input.user.profile.name']);
    expect(message).toContain('input.user.profile.name:');
    expect(message).toContain('John');
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

  it('should handle number values without quotes', () => {
    const event = { output: { code: 200 } };
    const message = buildKeysMessage(event, ['output.code']);
    expect(message).toContain('200');
    expect(message).not.toContain('"200"');
  });
});
