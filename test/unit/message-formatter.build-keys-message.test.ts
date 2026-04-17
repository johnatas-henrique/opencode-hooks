import {
  buildKeysMessage,
  buildKeysMessageSimple,
} from '../../.opencode/plugins/features/message-formatter/build-keys-message';

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

  it('should expand args object in input', () => {
    const event = {
      input: {
        args: {
          flag1: true,
          flag2: 'value',
        },
      },
    };
    const message = buildKeysMessage(event);
    expect(message).toBeDefined();
    expect(message.length).toBeGreaterThan(0);
  });

  it('should handle null args', () => {
    const event = { input: { args: null } };
    const message = buildKeysMessage(event);
    expect(message).toBeDefined();
  });

  it('should include properties when no allowedFields', () => {
    const event = {
      properties: {
        customKey: 'customValue',
      },
    };
    const message = buildKeysMessage(event);
    expect(message).toBeDefined();
    expect(message.length).toBeGreaterThan(0);
  });

  it('should search properties when field has no prefix', () => {
    const event = {
      properties: { searchMe: 'found' },
    };
    const message = buildKeysMessage(event, ['searchMe']);
    expect(message).toBeDefined();
    expect(message.length).toBeGreaterThan(0);
  });

  it('should handle allowedFields with properties content', () => {
    const event = {
      properties: { customProp: 'value' },
    };
    const message = buildKeysMessage(event, ['customProp']);
    expect(message).toBeDefined();
  });

  it('should handle undefined field value in allowedFields', () => {
    const event = {
      input: { name: 'test' },
    };
    const message = buildKeysMessage(event, ['nonexistent']);
    expect(message).toBeDefined();
  });

  it('should handle empty properties with allowedFields', () => {
    const event = {
      input: { name: 'test' },
    };
    const message = buildKeysMessage(event, ['customProp']);
    expect(message).toBeDefined();
  });
});

describe('buildKeysMessageSimple', () => {
  it('should flatten properties without allowedFields', () => {
    const event = { properties: { name: 'John', age: 30 } };
    const message = buildKeysMessageSimple(event);
    expect(message).toContain('name: "John"');
    expect(message).toContain('age: 30');
  });

  it('should flatten nested properties', () => {
    const event = {
      properties: { user: { name: 'John', profile: { age: 30 } } },
    };
    const message = buildKeysMessageSimple(event);
    expect(message).toContain('user.name: "John"');
    expect(message).toContain('user.profile.age: 30');
  });

  it('should use allowedFields with properties', () => {
    const event = { properties: { name: 'John', age: 30 } };
    const message = buildKeysMessageSimple(event, ['name']);
    expect(message).toContain('name: "John"');
    expect(message).not.toContain('age: 30');
  });

  it('should handle non-object values at root level', () => {
    const event = { properties: { count: 42, active: true } };
    const message = buildKeysMessageSimple(event);
    expect(message).toContain('count: 42');
    expect(message).toContain('active: true');
  });

  it('should include Time in output', () => {
    const event = { properties: { key: 'value' } };
    const message = buildKeysMessageSimple(event);
    expect(message).toMatch(/Time:/);
  });

  it('should handle empty properties', () => {
    const event = { properties: {} };
    const message = buildKeysMessageSimple(event);
    expect(message).toContain('Time:');
  });
});

it('should handle undefined properties', () => {
  const event = {};
  const message = buildKeysMessageSimple(event);
  expect(message).toContain('Time:');
});

it('should handle null properties', () => {
  const event = { properties: null };
  const message = buildKeysMessageSimple(event);
  expect(message).toContain('Time:');
});
