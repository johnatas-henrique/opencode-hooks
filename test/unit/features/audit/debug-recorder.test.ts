import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDebugRecorder } from '.opencode/plugins/features/audit/debug-recorder';

describe('getDebugRecorder', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).__opencode_debug_recorder;
  });

  it('returns null before any set', () => {
    expect(getDebugRecorder()).toBeFalsy();
  });

  it('returns the recorder after direct set', () => {
    const mockRecorder = { logDebug: vi.fn() };
    (globalThis as Record<string, unknown>).__opencode_debug_recorder =
      mockRecorder;
    expect(getDebugRecorder()).toBe(mockRecorder);
  });

  it('overwrites previous recorder', () => {
    const first = { logDebug: vi.fn() };
    const second = { logDebug: vi.fn() };
    (globalThis as Record<string, unknown>).__opencode_debug_recorder = first;
    (globalThis as Record<string, unknown>).__opencode_debug_recorder = second;
    expect(getDebugRecorder()).toBe(second);
  });

  it('roundtrips with the same recorder', () => {
    const recorder = { logDebug: vi.fn() };
    (globalThis as Record<string, unknown>).__opencode_debug_recorder =
      recorder;
    const retrieved = getDebugRecorder();
    expect(retrieved).toBe(recorder);
  });
});
