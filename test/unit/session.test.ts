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
    it('should return false for known non-primary session', () => {
      isPrimarySession('session-1');
      isPrimarySession('session-2');
      expect(isPrimarySession('session-2')).toBe(false);
    });
  });

  describe('resetSessionTracking', () => {
    it('should reset primary session id', () => {
      isPrimarySession('session-1');
      resetSessionTracking();
      expect(getPrimarySessionId()).toBeNull();
    });
  });
});
