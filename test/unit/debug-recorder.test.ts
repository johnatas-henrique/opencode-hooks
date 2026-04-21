import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDebugRecorder,
  getDebugRecorder,
  setDebugRecorder,
} from '../../.opencode/plugins/features/audit/debug-recorder';
import type { AuditLogger } from '../../.opencode/plugins/types/audit';

describe('debug-recorder', () => {
  let mockWriteLine: AuditLogger['writeLine'];
  let debugRecorder: ReturnType<typeof createDebugRecorder>;

  beforeEach(() => {
    mockWriteLine = vi.fn().mockResolvedValue(undefined);
    debugRecorder = createDebugRecorder({
      writeLine: mockWriteLine,
      rotate: vi.fn().mockResolvedValue(undefined),
      cleanup: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    setDebugRecorder(null as unknown as ReturnType<typeof createDebugRecorder>);
  });

  it('should log debug event with message', async () => {
    await debugRecorder.logDebug({
      message: 'Test debug message',
    });

    expect(mockWriteLine).toHaveBeenCalledTimes(1);
  });

  it('should log debug with data', async () => {
    await debugRecorder.logDebug({
      message: 'State change',
      data: { key: 'value', count: 42 },
    });

    expect(mockWriteLine).toHaveBeenCalledTimes(1);
  });

  it('should log debug with warn level', async () => {
    await debugRecorder.logDebug({
      message: 'Warning',
      level: 'warn',
    });

    expect(mockWriteLine).toHaveBeenCalledTimes(1);
  });

  it('should log debug with error level', async () => {
    await debugRecorder.logDebug({
      message: 'Error occurred',
      level: 'error',
    });

    expect(mockWriteLine).toHaveBeenCalledTimes(1);
  });

  describe('getDebugRecorder', () => {
    it('should return null when not set', () => {
      expect(getDebugRecorder()).toBeNull();
    });

    it('should return set recorder', () => {
      setDebugRecorder(debugRecorder);
      expect(getDebugRecorder()).toBe(debugRecorder);
    });

    it('should handle multiple set/get cycles', () => {
      setDebugRecorder(debugRecorder);
      const r1 = getDebugRecorder();
      setDebugRecorder(debugRecorder);
      const r2 = getDebugRecorder();
      expect(r1).toBe(r2);
    });
  });
});
