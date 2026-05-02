import {
  maskSensitive,
  SENSITIVE_PATTERNS,
} from '.opencode/plugins/features/message-formatter/mask-sensitive';

describe('maskSensitive', () => {
  it.skip('masks api key', () => {
    const input = 'api_key=secret123';
    const result = maskSensitive(input);
    expect(result).toBe('api_key: [REDACTED]');
  });

  it.skip('masks token', () => {
    const input = 'token=abc123';
    const result = maskSensitive(input);
    expect(result).toBe('token: [REDACTED]');
  });

  it.skip('masks secret', () => {
    const input = 'secret=mysecret';
    const result = maskSensitive(input);
    expect(result).toBe('secret: [REDACTED]');
  });

  it.skip('masks password', () => {
    const input = 'password=pass123';
    const result = maskSensitive(input);
    expect(result).toBe('password: [REDACTED]');
  });

  it.skip('masks credential', () => {
    const input = 'credential=mycred';
    const result = maskSensitive(input);
    expect(result).toBe('credential: [REDACTED]');
  });

  it.skip('masks bearer token', () => {
    const input = 'bearer abc123def456';
    const result = maskSensitive(input);
    expect(result).toBe('bearer: [REDACTED]');
  });

  it.skip('masks github token', () => {
    const input = 'ghp_abcdefghijklmnopqrstuvwxyz123456';
    const result = maskSensitive(input);
    expect(result).toBe('ghp_: [REDACTED]');
  });

  it.skip('handles multiple patterns in same string', () => {
    const input = 'api_key=123 token=456';
    const result = maskSensitive(input);
    expect(result).toBe('api_key: [REDACTED] token: [REDACTED]');
  });

  it.skip('returns original string when no patterns match', () => {
    const input = 'hello world';
    const result = maskSensitive(input);
    expect(result).toBe('hello world');
  });

  it.skip('uses custom patterns when provided', () => {
    const input = 'custom=value123';
    const customPatterns: Array<[RegExp, string]> = [
      [/(custom)[=:](\w+)/gi, '$1'],
    ];
    const result = maskSensitive(input, customPatterns);
    expect(result).toBe('custom: [REDACTED]');
  });

  it.skip('handles empty string', () => {
    const result = maskSensitive('');
    expect(result).toBe('');
  });
});

describe('SENSITIVE_PATTERNS', () => {
  it.skip('contains expected number of patterns', () => {
    expect(SENSITIVE_PATTERNS.length).toBe(7);
  });

  it.skip('each pattern is a tuple of RegExp and string', () => {
    for (const [pattern, replacement] of SENSITIVE_PATTERNS) {
      expect(pattern instanceof RegExp).toBe(true);
      expect(typeof replacement).toBe('string');
    }
  });
});
