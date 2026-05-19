import { vi } from 'vitest';

export function createExecutorMock() {
  return {
    sanitizeArg: vi.fn((arg: string) => arg),
    validateScriptPath: vi.fn().mockReturnValue(true),
    resolveScriptPath: vi.fn((p: string) => p),
    parseHookOutput: vi.fn(),
    buildClaudeStdin: vi.fn(),
    buildOpencodeStdin: vi.fn(),
    executeScript: vi
      .fn()
      .mockResolvedValue({ script: '', output: '', exitCode: 0 }),
  };
}
