import {
  isPrimarySession,
  getPrimarySessionId,
  resetSessionTracking,
} from '../../.opencode/plugins/core/session';

describe('session.ts', () => {
  beforeEach(() => {
    resetSessionTracking();
  });

  describe('isPrimarySession', () => {
    it('should return true for first session', () => {
      expect(isPrimarySession('session-1')).toBe(true);
    });

    it('should return true for same session', () => {
      isPrimarySession('session-1');
      expect(isPrimarySession('session-1')).toBe(true);
    });

    it('should return false for new session', () => {
      isPrimarySession('session-1');
      expect(isPrimarySession('session-2')).toBe(false);
    });

    it('should return false for known non-primary session', () => {
      isPrimarySession('session-1');
      isPrimarySession('session-2');
      expect(isPrimarySession('session-2')).toBe(false);
    });
  });

  describe('getPrimarySessionId', () => {
    it('should return null before any session', () => {
      expect(getPrimarySessionId()).toBeNull();
    });

    it('should return session id after first session', () => {
      isPrimarySession('session-1');
      expect(getPrimarySessionId()).toBe('session-1');
    });
  });

  describe('resetSessionTracking', () => {
    it('should reset primary session id', () => {
      isPrimarySession('session-1');
      resetSessionTracking();
      expect(getPrimarySessionId()).toBeNull();
    });

    it('should allow new primary after reset', () => {
      isPrimarySession('session-1');
      resetSessionTracking();
      expect(isPrimarySession('session-2')).toBe(true);
    });
  });
});
