import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSecurityRecorder,
  getSecurityRecorder,
  setSecurityRecorder,
} from '.opencode/plugins/features/audit/security-recorder';

describe('createSecurityRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a record with event block.security', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const logger = {
      writeLine: mockWriteLine,
      cleanup: vi.fn().mockResolvedValue(undefined),
    };

    const recorder = createSecurityRecorder(logger);
    await recorder.logSecurity({
      sessionID: 's1',
      toolName: 'bash',
      rule: 'no-curl',
      reason: 'curl is blocked',
      input: { url: 'http://evil.com' },
    });

    expect(mockWriteLine).toHaveBeenCalledOnce();
    expect(mockWriteLine.mock.calls[0][0]).toBe('security');
    const record = mockWriteLine.mock.calls[0][1] as Record<string, unknown>;
    expect(record.event).toBe('block.security');
    expect(record.session).toBe('s1');
    expect(record.toolName).toBe('bash');
    expect(record.rule).toBe('no-curl');
    expect(record.reason).toBe('curl is blocked');
    expect(record.input).toEqual({ url: 'http://evil.com' });
  });

  it('handles minimal input', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const logger = {
      writeLine: mockWriteLine,
      cleanup: vi.fn().mockResolvedValue(undefined),
    };

    const recorder = createSecurityRecorder(logger);
    await recorder.logSecurity({ rule: 'default-deny' });

    expect(mockWriteLine).toHaveBeenCalledOnce();
    const record = mockWriteLine.mock.calls[0][1] as Record<string, unknown>;
    expect(record.rule).toBe('default-deny');
    expect(record.event).toBe('block.security');
  });

  it('includes timestamp in record', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const logger = {
      writeLine: mockWriteLine,
      cleanup: vi.fn().mockResolvedValue(undefined),
    };

    const recorder = createSecurityRecorder(logger);
    await recorder.logSecurity({ rule: 'test', reason: 'test' });

    const record = mockWriteLine.mock.calls[0][1] as Record<string, unknown>;
    expect(record.ts).toEqual(expect.any(String));
  });
});

describe('getSecurityRecorder / setSecurityRecorder', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).__opencode_security_recorder;
  });

  it('returns null before any set', () => {
    expect(getSecurityRecorder()).toBeFalsy();
  });

  it('returns the recorder after set', () => {
    const mockRecorder = { logSecurity: vi.fn() };
    setSecurityRecorder(mockRecorder);
    expect(getSecurityRecorder()).toBe(mockRecorder);
  });

  it('overwrites previous recorder on second set', () => {
    const first = { logSecurity: vi.fn() };
    const second = { logSecurity: vi.fn() };
    setSecurityRecorder(first);
    setSecurityRecorder(second);
    expect(getSecurityRecorder()).toBe(second);
  });

  it('roundtrips with the same recorder', () => {
    const recorder = { logSecurity: vi.fn() };
    setSecurityRecorder(recorder);
    const retrieved = getSecurityRecorder();
    expect(retrieved).toBe(recorder);
  });
});
