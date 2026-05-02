import { ScriptExecutor } from '.opencode/plugins/features/scripts/script-executor';
import type { ScriptExecutorDeps } from '.opencode/plugins/types/executor';
import type { EventVariant } from '.opencode/plugins/types/config';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ScriptExecutor', () => {
  let mockDeps: ScriptExecutorDeps;
  let executor: ScriptExecutor;

  const mockExecuteScript = vi.fn();
  const mockAudit = { logScript: vi.fn() };
  const mockSession = { appendToSession: vi.fn() };
  const mockToast = { showToast: vi.fn() };
  const mockIsSubagent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = {
      executeScript: mockExecuteScript,
      audit: mockAudit,
      session: mockSession,
      toast: mockToast,
      isSubagent: mockIsSubagent,
    };
    executor = new ScriptExecutor(mockDeps);
  });

  const EventContext = (
    overrides: Partial<{
      eventType: string;
      toolName?: string;
      toastTitle: string;
      scriptToasts: {
        showError: boolean;
        errorVariant: EventVariant;
        errorDuration: number;
        errorTitle: string;
      };
      timestamp: string;
      sessionId: string;
    }> = {}
  ) => ({
    eventType: 'test.event',
    toolName: undefined,
    toastTitle: '====TEST====',
    scriptToasts: {
      showError: true,
      errorVariant: 'error' as EventVariant,
      errorDuration: 5000,
      errorTitle: 'ERROR',
    },
    timestamp: new Date().toISOString(),
    sessionId: 'test-session',
    ...overrides,
  });

  it('should not toast on error if suppressToast option is true', async () => {
    mockExecuteScript.mockResolvedValueOnce({
      output: '',
      error: 'err',
      exitCode: 1,
    });

    await executor.execute(
      'error.sh',
      undefined,
      { suppressToast: true },
      EventContext()
    );

    expect(mockToast.showToast).not.toHaveBeenCalled();
    expect(mockAudit.logScript).toHaveBeenCalledTimes(1);
  });

  it('should block execution for subagent sessions when runOnlyOnce is true', async () => {
    mockIsSubagent.mockReturnValueOnce(true);
    mockExecuteScript.mockResolvedValueOnce({
      output: 'should not run',
      error: null,
      exitCode: 0,
    });

    const result = await executor.execute(
      'script.sh',
      undefined,
      { runOnlyOnce: true },
      EventContext({ sessionId: 'subagent-session' })
    );

    expect(result).toEqual({ script: 'script.sh', output: undefined });
    expect(mockIsSubagent).toHaveBeenCalledWith('subagent-session');
    expect(mockExecuteScript).not.toHaveBeenCalled();
  });

  it('should pass scriptArg correctly to executeScript', async () => {
    mockExecuteScript.mockResolvedValueOnce({
      output: 'ok',
      error: null,
      exitCode: 0,
    });

    await executor.execute('script.sh', 'arg1', {}, EventContext());

    expect(mockExecuteScript).toHaveBeenCalledWith('script.sh', 'arg1');
  });
});
