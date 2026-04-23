import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSecurityRecorder,
  getSecurityRecorder,
  setSecurityRecorder,
} from '../../.opencode/plugins/features/audit/security-recorder';
import type { AuditLogger } from '../../.opencode/plugins/types/audit';

describe('security-recorder', () => {
  let mockWriteLine: AuditLogger['writeLine'];
  let securityRecorder: ReturnType<typeof createSecurityRecorder>;

  beforeEach(() => {
    mockWriteLine = vi.fn().mockResolvedValue(undefined);
    securityRecorder = createSecurityRecorder({
      writeLine: mockWriteLine,
      cleanup: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    setSecurityRecorder(
      null as unknown as ReturnType<typeof createSecurityRecorder>
    );
  });

  it('should log security block event', async () => {
    await securityRecorder.logSecurity({
      toolName: 'bash',
      rule: 'no-delete-on-main',
      reason: 'Cannot delete on main branch',
      input: { command: 'rm -rf /' },
    });

    expect(mockWriteLine).toHaveBeenCalledTimes(1);
  });

  it('should log security with session', async () => {
    await securityRecorder.logSecurity({
      toolName: 'read',
      rule: 'no-exec',
      reason: 'Blocked',
      input: {},
      sessionID: 'ses_test',
    });

    expect(mockWriteLine).toHaveBeenCalledTimes(1);
  });

  describe('getSecurityRecorder', () => {
    it('should return null when not set', () => {
      expect(getSecurityRecorder()).toBeNull();
    });

    it('should return set recorder', () => {
      setSecurityRecorder(securityRecorder);
      expect(getSecurityRecorder()).toBe(securityRecorder);
    });

    it('should handle multiple set/get cycles', () => {
      setSecurityRecorder(securityRecorder);
      const r1 = getSecurityRecorder();
      setSecurityRecorder(securityRecorder);
      const r2 = getSecurityRecorder();
      expect(r1).toBe(r2);
    });
  });
});
