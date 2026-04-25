import { ScriptExecutor } from '../../.opencode/plugins/features/scripts/script-executor';
import type { ScriptExecutorDeps } from '../../.opencode/plugins/types/executor';
import type { EventVariant } from '../../.opencode/plugins/types/config';
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

  it('should execute script successfully and append to session', async () => {
    mockExecuteScript.mockResolvedValueOnce({
      output: 'ok output',
      error: null,
      exitCode: 0,
    });

    const result = await executor.execute(
      'script.sh',
      undefined,
      {},
      EventContext()
    );

    expect(result).toEqual({ script: 'script.sh', output: 'ok output' });
    expect(mockExecuteScript).toHaveBeenCalledWith('script.sh');
    expect(mockAudit.logScript).toHaveBeenCalledTimes(1);
    expect(mockSession.appendToSession).toHaveBeenCalledWith(
      'test-session',
      'ok output'
    );
    expect(mockToast.showToast).not.toHaveBeenCalled();
  });

  it('should handle script error and show toast and audit', async () => {
    mockExecuteScript.mockResolvedValueOnce({
      output: '',
      error: 'some error',
      exitCode: 1,
    });

    const result = await executor.execute(
      'error.sh',
      undefined,
      {},
      EventContext()
    );

    expect(result).toEqual({ script: 'error.sh', output: undefined });
    expect(mockExecuteScript).toHaveBeenCalledWith('error.sh');
    expect(mockAudit.logScript).toHaveBeenCalledTimes(1);
    expect(mockToast.showToast).toHaveBeenCalledWith(
      '====TEST ERROR====',
      expect.stringContaining('Event: test.event'),
      'error',
      5000
    );
    expect(mockSession.appendToSession).not.toHaveBeenCalled();
  });

  it('should not append to session if skipSession option is true', async () => {
    mockExecuteScript.mockResolvedValueOnce({
      output: 'output',
      error: null,
      exitCode: 0,
    });

    await executor.execute(
      'script.sh',
      undefined,
      { skipSession: true },
      EventContext()
    );

    expect(mockSession.appendToSession).not.toHaveBeenCalled();
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
    expect(mockAudit.logScript).toHaveBeenCalledTimes(1); // audit still called
  });

  it('should not audit if skipAudit option is true (success)', async () => {
    mockExecuteScript.mockResolvedValueOnce({
      output: 'output',
      error: null,
      exitCode: 0,
    });

    await executor.execute(
      'script.sh',
      undefined,
      { skipAudit: true },
      EventContext()
    );

    expect(mockAudit.logScript).not.toHaveBeenCalled();
    expect(mockSession.appendToSession).toHaveBeenCalled();
  });

  it('should not audit on success if no output', async () => {
    mockExecuteScript.mockResolvedValueOnce({
      output: '',
      error: null,
      exitCode: 0,
    });

    await executor.execute('script.sh', undefined, {}, EventContext());

    expect(mockAudit.logScript).not.toHaveBeenCalled();
    expect(mockSession.appendToSession).not.toHaveBeenCalled();
  });

  it('should respect runOnlyOnce for non-subagent sessions', async () => {
    mockIsSubagent.mockReturnValueOnce(false);
    mockExecuteScript.mockResolvedValueOnce({
      output: 'ok',
      error: null,
      exitCode: 0,
    });

    const result = await executor.execute(
      'script.sh',
      undefined,
      { runOnlyOnce: true },
      EventContext({ sessionId: 'regular-session' })
    );

    expect(result).toEqual({ script: 'script.sh', output: 'ok' });
    expect(mockIsSubagent).toHaveBeenCalledWith('regular-session');
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
