import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScriptExecutor } from '.opencode/plugins/features/scripts/script-executor';
import type { ScriptExecutorDeps } from '.opencode/plugins/types/executor';
import { EventVariant } from '.opencode/plugins/types/config';

function makeDeps(
  overrides: Partial<ScriptExecutorDeps> = {}
): ScriptExecutorDeps {
  return {
    executeScript: vi
      .fn()
      .mockResolvedValue({ output: 'done', error: null, exitCode: 0 }),
    audit: { logScript: vi.fn().mockResolvedValue(undefined) },
    session: { appendToSession: vi.fn().mockResolvedValue(undefined) },
    toast: { showToast: vi.fn() },
    isSubagent: vi.fn().mockReturnValue(false),
    ...overrides,
  };
}

function makeEventContext(): {
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
} {
  return {
    eventType: 'session.created',
    toolName: undefined,
    toastTitle: '=== Script Output ===',
    scriptToasts: {
      showError: true,
      errorVariant: 'error' as const,
      errorDuration: 15000,
      errorTitle: 'Error',
    },
    timestamp: '2026-01-01T00:00:00.000Z',
    sessionId: 'ses_test123',
  };
}

function makeExecutor(overrides: Partial<ScriptExecutorDeps> = {}) {
  const deps = makeDeps(overrides);
  return { deps, executor: new ScriptExecutor(deps) };
}

async function runExecutorFail(script: string = 'test.sh', arg?: string) {
  const { deps, executor } = makeExecutor({
    executeScript: vi
      .fn()
      .mockResolvedValue({ output: 'fail', error: 'err', exitCode: 1 }),
  });
  const ctx = makeEventContext();
  ctx.eventType = 'tool.execute.before';
  ctx.toolName = 'bash';
  await executor.execute(script, arg, {}, ctx);
  return { deps };
}

describe('ScriptExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('returns success with output on exit code 0', async () => {
      const { executor } = makeExecutor();
      const result = await executor.execute(
        'test.sh',
        undefined,
        {},
        makeEventContext()
      );
      expect(result).toEqual({ script: 'test.sh', output: 'done' });
    });

    it('passes arg to executeScript', async () => {
      const { deps, executor } = makeExecutor();
      await executor.execute('test.sh', '--verbose', {}, makeEventContext());
      expect(deps.executeScript).toHaveBeenCalledWith('test.sh', '--verbose');
    });

    it('calls executeScript without arg when arg is undefined', async () => {
      const { deps, executor } = makeExecutor();
      await executor.execute('test.sh', undefined, {}, makeEventContext());
      expect(deps.executeScript).toHaveBeenCalledWith('test.sh');
    });

    it('returns runOnlyOnce early when isSubagent returns true', async () => {
      const { deps, executor } = makeExecutor({
        isSubagent: vi.fn().mockReturnValue(true),
      });
      const result = await executor.execute(
        'test.sh',
        undefined,
        { runOnlyOnce: true },
        makeEventContext()
      );
      expect(result).toEqual({ script: 'test.sh', output: undefined });
      expect(deps.executeScript).not.toHaveBeenCalled();
    });

    it('does not gate when runOnlyOnce is false', async () => {
      const { deps, executor } = makeExecutor({
        isSubagent: vi.fn().mockReturnValue(true),
      });
      await executor.execute(
        'test.sh',
        undefined,
        { runOnlyOnce: false },
        makeEventContext()
      );
      expect(deps.executeScript).toHaveBeenCalled();
    });

    it('continues when runOnlyOnce is true but session is not subagent', async () => {
      const { deps, executor } = makeExecutor({
        isSubagent: vi.fn().mockReturnValue(false),
      });
      await executor.execute(
        'test.sh',
        undefined,
        { runOnlyOnce: true },
        makeEventContext()
      );
      expect(deps.executeScript).toHaveBeenCalled();
    });

    it('audits on error and shows toast', async () => {
      const { deps, executor } = makeExecutor({
        executeScript: vi
          .fn()
          .mockResolvedValue({ output: 'failed', error: 'boom', exitCode: 1 }),
      });
      const ctx = makeEventContext();
      await executor.execute('test.sh', undefined, {}, ctx);

      expect(deps.audit!.logScript).toHaveBeenCalled();
      expect(deps.toast!.showToast).toHaveBeenCalled();
    });

    it('respects suppressToast on error', async () => {
      const { deps, executor } = makeExecutor({
        executeScript: vi
          .fn()
          .mockResolvedValue({ output: 'failed', error: 'boom', exitCode: 1 }),
      });
      await executor.execute(
        'test.sh',
        undefined,
        { suppressToast: true },
        makeEventContext()
      );

      expect(deps.toast!.showToast).not.toHaveBeenCalled();
    });

    it('does not show toast when showError is false', async () => {
      const { deps, executor } = makeExecutor({
        executeScript: vi
          .fn()
          .mockResolvedValue({ output: 'failed', error: 'boom', exitCode: 1 }),
      });
      const ctx = makeEventContext();
      ctx.scriptToasts.showError = false;
      await executor.execute('test.sh', undefined, {}, ctx);

      expect(deps.toast!.showToast).not.toHaveBeenCalled();
    });

    it('does not call audit on error when audit is not set', async () => {
      const { executor } = makeExecutor({
        audit: undefined,
        executeScript: vi
          .fn()
          .mockResolvedValue({ output: 'failed', error: 'boom', exitCode: 1 }),
      });
      await executor.execute('test.sh', undefined, {}, makeEventContext());
    });

    it('skips audit on success when skipAudit is true', async () => {
      const { deps, executor } = makeExecutor();
      await executor.execute(
        'test.sh',
        undefined,
        { skipAudit: true },
        makeEventContext()
      );

      expect(deps.audit!.logScript).not.toHaveBeenCalled();
    });

    it('skips session append when skipSession is true', async () => {
      const { deps, executor } = makeExecutor();
      await executor.execute(
        'test.sh',
        undefined,
        { skipSession: true },
        makeEventContext()
      );

      expect(deps.session.appendToSession).not.toHaveBeenCalled();
    });

    it('appends to session on success', async () => {
      const { deps, executor } = makeExecutor();
      await executor.execute('test.sh', undefined, {}, makeEventContext());

      expect(deps.session.appendToSession).toHaveBeenCalledWith(
        'ses_test123',
        'done'
      );
    });

    it('does not append to session when output is empty', async () => {
      const { deps, executor } = makeExecutor({
        executeScript: vi
          .fn()
          .mockResolvedValue({ output: '', error: null, exitCode: 0 }),
      });
      await executor.execute('test.sh', undefined, {}, makeEventContext());

      expect(deps.session.appendToSession).not.toHaveBeenCalled();
    });

    it('uses toolName in toast event info for tool events', async () => {
      const { deps } = await runExecutorFail();

      expect(deps.toast!.showToast).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('bash'),
        expect.any(String),
        expect.any(Number)
      );
    });

    it('uses eventType in toast info when no toolName', async () => {
      const { deps, executor } = makeExecutor({
        executeScript: vi
          .fn()
          .mockResolvedValue({ output: 'fail', error: 'err', exitCode: 1 }),
      });
      const ctx = makeEventContext();
      ctx.eventType = 'session.created';
      await executor.execute('test.sh', undefined, {}, ctx);

      expect(deps.toast!.showToast).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('session.created'),
        expect.any(String),
        expect.any(Number)
      );
    });

    it('creates scriptData with args when arg is provided on error', async () => {
      const { deps } = await runExecutorFail('test.sh', 'bash');

      expect(deps.audit!.logScript).toHaveBeenCalledWith(
        expect.objectContaining({ args: ['bash'] }),
        expect.any(Object)
      );
    });
  });
});
