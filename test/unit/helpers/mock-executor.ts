import { vi } from 'vitest';

export function createExecutorMock() {
  return {
    sanitizeArg: vi.fn((arg: string) => arg),
    validateScriptPath: vi.fn().mockReturnValue(true),
    resolveScriptPath: vi.fn((p: string) => p),
    getStopHookStateFile: vi.fn(),
    getStopHookActive: vi.fn().mockReturnValue(false),
    setStopHookState: vi.fn(),
    clearStopHookState: vi.fn(),
    parseHookOutput: vi.fn(),
    buildClaudeStdin: vi.fn(),
    buildOpencodeStdin: vi.fn(),
    executeScript: vi
      .fn()
      .mockResolvedValue({ script: '', output: '', exitCode: 0 }),
  };
}
