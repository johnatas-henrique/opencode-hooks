import {
  isPrimarySession,
  getPrimarySessionId,
  resetSessionTracking,
} from '../.opencode/plugins/helpers/session';

describe('Property-based: session', () => {
  beforeEach(() => {
    resetSessionTracking();
  });

  it('isPrimarySession should return boolean for all inputs', () => {
    const sessionIds = [
      'primary-session-123',
      'secondary-456',
      'random-id-789',
      '',
      'PRIMARY',
      'SECONDARY',
    ];

    for (const sessionId of sessionIds) {
      const result = isPrimarySession(sessionId);
      expect(typeof result).toBe('boolean');
    }
  });

  it('getPrimarySessionId should return null or string', () => {
    const result = getPrimarySessionId();
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('isPrimarySession should be consistent for same input', () => {
    const sessionId = 'test-session-123';

    const result1 = isPrimarySession(sessionId);
    const result2 = isPrimarySession(sessionId);
    const result3 = isPrimarySession(sessionId);

    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  it('should handle empty string session ID', () => {
    expect(() => isPrimarySession('')).not.toThrow();
  });

  it('should handle very long session IDs', () => {
    const longId = 'a'.repeat(1000);
    expect(() => isPrimarySession(longId)).not.toThrow();
    expect(typeof isPrimarySession(longId)).toBe('boolean');
  });

  it('should handle special characters in session ID', () => {
    const specialIds = [
      'session-id-with-dashes',
      'session_id_with_underscores',
      'session.id.with.dots',
    ];

    for (const id of specialIds) {
      expect(() => isPrimarySession(id)).not.toThrow();
      expect(typeof isPrimarySession(id)).toBe('boolean');
    }
  });
});
