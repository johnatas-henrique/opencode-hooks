import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSecurityRecorder } from '.opencode/plugins/features/audit/security-recorder';

describe('getSecurityRecorder', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).__opencode_security_recorder;
  });

  it('returns null before any set', () => {
    expect(getSecurityRecorder()).toBeFalsy();
  });

  it('returns the recorder after direct set', () => {
    const mockRecorder = { logSecurity: vi.fn() };
    (globalThis as Record<string, unknown>).__opencode_security_recorder =
      mockRecorder;
    expect(getSecurityRecorder()).toBe(mockRecorder);
  });

  it('overwrites previous recorder', () => {
    const first = { logSecurity: vi.fn() };
    const second = { logSecurity: vi.fn() };
    (globalThis as Record<string, unknown>).__opencode_security_recorder =
      first;
    (globalThis as Record<string, unknown>).__opencode_security_recorder =
      second;
    expect(getSecurityRecorder()).toBe(second);
  });

  it('roundtrips with the same recorder', () => {
    const recorder = { logSecurity: vi.fn() };
    (globalThis as Record<string, unknown>).__opencode_security_recorder =
      recorder;
    const retrieved = getSecurityRecorder();
    expect(retrieved).toBe(recorder);
  });
});
