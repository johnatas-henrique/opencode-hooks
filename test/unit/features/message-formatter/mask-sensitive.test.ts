import { SENSITIVE_PATTERNS } from '.opencode/plugins/features/message-formatter/mask-sensitive';

describe('SENSITIVE_PATTERNS', () => {
  it('each pattern is a tuple of RegExp and string', () => {
    for (const [pattern, replacement] of SENSITIVE_PATTERNS) {
      expect(pattern instanceof RegExp).toBe(true);
      expect(typeof replacement).toBe('string');
    }
  });
});
