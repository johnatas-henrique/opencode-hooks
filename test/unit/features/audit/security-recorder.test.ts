import {
  createSecurityRecorder,
  getSecurityRecorder,
  setSecurityRecorder,
} from '.opencode/plugins/features/audit/security-recorder';
import type {
  AuditLogger,
  SecurityRecorder,
} from '.opencode/plugins/types/audit';

describe('security-recorder', () => {
  let mockLogger: { writeLine: ReturnType<typeof vi.fn> };
  let recorder: SecurityRecorder;

  beforeEach(() => {
    mockLogger = { writeLine: vi.fn().mockResolvedValue(undefined) };
    recorder = createSecurityRecorder(mockLogger as unknown as AuditLogger);
  });

  it('creates recorder with logSecurity method', () => {
    expect(recorder.logSecurity).toBeDefined();
    expect(typeof recorder.logSecurity).toBe('function');
  });

  it('logSecurity writes security record', async () => {
    await recorder.logSecurity({
      sessionID: 'sess-1',
      toolName: 'bash',
      rule: 'no-rm-rf',
      reason: 'Command blocked',
      input: { command: 'rm -rf /' },
    });

    expect(mockLogger.writeLine).toHaveBeenCalledTimes(1);
    const [fileType, record] = mockLogger.writeLine.mock.calls[0];
    expect(fileType).toBe('security');
    expect(record).toMatchObject({
      event: 'block.security',
      session: 'sess-1',
      toolName: 'bash',
      rule: 'no-rm-rf',
      reason: 'Command blocked',
    });
    expect(record.ts).toBeDefined();
    expect(record.input).toEqual({ command: 'rm -rf /' });
  });

  it('logSecurity handles missing optional fields', async () => {
    await recorder.logSecurity({
      sessionID: 'sess-2',
      rule: 'test-rule',
      reason: 'test reason',
    });

    const [, record] = mockLogger.writeLine.mock.calls[0];
    expect(record).toMatchObject({
      event: 'block.security',
      session: 'sess-2',
      rule: 'test-rule',
      reason: 'test reason',
    });
    expect(record.toolName).toBeUndefined();
    expect(record.input).toBeUndefined();
  });

  it('getSecurityRecorder returns undefined when not set', () => {
    setSecurityRecorder(undefined as unknown as SecurityRecorder);
    expect(getSecurityRecorder()).toBeUndefined();
  });

  it('setSecurityRecorder stores recorder globally', () => {
    const testRecorder = {
      logSecurity: vi.fn(),
    } as unknown as SecurityRecorder;
    setSecurityRecorder(testRecorder);
    expect(getSecurityRecorder()).toBe(testRecorder);
  });

  it('getSecurityRecorder returns stored recorder', () => {
    const testRecorder: SecurityRecorder = {
      logSecurity: vi.fn(),
    };
    setSecurityRecorder(testRecorder);
    expect(getSecurityRecorder()).toBe(testRecorder);
  });

  it('setSecurityRecorder can clear by setting undefined', () => {
    const testRecorder: SecurityRecorder = {
      logSecurity: vi.fn(),
    };
    setSecurityRecorder(testRecorder);
    setSecurityRecorder(undefined as unknown as SecurityRecorder);
    expect(getSecurityRecorder()).toBeUndefined();
  });
});
