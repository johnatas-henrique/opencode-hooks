import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDebugRecorder,
  getDebugRecorder,
  setDebugRecorder,
} from '.opencode/plugins/features/audit/debug-recorder';

describe('createDebugRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a record with default level info', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const logger = {
      writeLine: mockWriteLine,
      cleanup: vi.fn().mockResolvedValue(undefined),
    };

    const recorder = createDebugRecorder(logger);
    await recorder.logDebug({ message: 'test message' });

    expect(mockWriteLine).toHaveBeenCalledOnce();
    const record = mockWriteLine.mock.calls[0][1] as Record<string, unknown>;
    expect(record.event).toBe('debug');
    expect(record.message).toBe('test message');
    expect(record.level).toBe('info');
    expect(record.ts).toEqual(expect.any(String));
  });

  it('uses provided level', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const logger = {
      writeLine: mockWriteLine,
      cleanup: vi.fn().mockResolvedValue(undefined),
    };

    const recorder = createDebugRecorder(logger);
    await recorder.logDebug({ message: 'warn', level: 'warn' });

    const record = mockWriteLine.mock.calls[0][1] as Record<string, unknown>;
    expect(record.level).toBe('warn');
  });

  it('includes optional data', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const logger = {
      writeLine: mockWriteLine,
      cleanup: vi.fn().mockResolvedValue(undefined),
    };

    const recorder = createDebugRecorder(logger);
    await recorder.logDebug({ message: 'with data', data: { key: 'val' } });

    const record = mockWriteLine.mock.calls[0][1] as Record<string, unknown>;
    expect(record.data).toEqual({ key: 'val' });
  });

  it('calls logger.writeLine with debug type', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const logger = {
      writeLine: mockWriteLine,
      cleanup: vi.fn().mockResolvedValue(undefined),
    };

    const recorder = createDebugRecorder(logger);
    await recorder.logDebug({ message: 'test' });

    expect(mockWriteLine.mock.calls[0][0]).toBe('debug');
  });
});

describe('getDebugRecorder / setDebugRecorder', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).__opencode_debug_recorder;
  });

  it('returns null before any set', () => {
    expect(getDebugRecorder()).toBeFalsy();
  });

  it('returns the recorder after set', () => {
    const mockRecorder = { logDebug: vi.fn() };
    setDebugRecorder(mockRecorder);
    expect(getDebugRecorder()).toBe(mockRecorder);
  });

  it('overwrites previous recorder on second set', () => {
    const first = { logDebug: vi.fn() };
    const second = { logDebug: vi.fn() };
    setDebugRecorder(first);
    setDebugRecorder(second);
    expect(getDebugRecorder()).toBe(second);
  });

  it('roundtrips with the same recorder', () => {
    const recorder = { logDebug: vi.fn() };
    setDebugRecorder(recorder);
    const retrieved = getDebugRecorder();
    expect(retrieved).toBe(recorder);
  });
});
