import { ScriptExecutor } from '.opencode/plugins/features/scripts/script-executor';
import {
  validateScriptPath,
  sanitizeArg,
} from '.opencode/plugins/features/scripts/executor';
import type { ScriptExecutorDeps } from '.opencode/plugins/types/executor';

const fakeEventContext = {
  eventType: 'session.created',
  toolName: undefined,
  toastTitle: 'Test=',
  scriptToasts: {
    showError: false,
    errorVariant: 'error' as const,
    errorDuration: 5000,
    errorTitle: 'FAILED',
  },
  timestamp: '2026-01-01T00:00:00.000Z',
  sessionId: 'sess-1',
};

function makeDeps(
  overrides: Partial<ScriptExecutorDeps> = {}
): ScriptExecutorDeps {
  return {
    executeScript: vi
      .fn()
      .mockResolvedValue({ output: '', error: null, exitCode: 0 }),
    audit: undefined,
    session: { appendToSession: vi.fn().mockResolvedValue(undefined) },
    toast: undefined,
    isSubagent: vi.fn().mockReturnValue(false),
    ...overrides,
  };
}

function createScriptExecutorAuditTest(skipAudit: boolean = false) {
  const executeScript = vi.fn().mockResolvedValue({
    output: 'success',
    error: null,
    exitCode: 0,
  });
  const logScript = vi.fn().mockResolvedValue(undefined);
  const audit = { logScript };
  const executor = new ScriptExecutor(makeDeps({ executeScript, audit }));
  return { executor, logScript, options: { skipAudit } };
}

function createToastErrorTest(suppressToast: boolean): {
  executor: ScriptExecutor;
  options: { suppressToast: boolean };
  eventContext: typeof fakeEventContext;
  showToast: ReturnType<typeof vi.fn>;
} {
  const executeScript = vi.fn().mockResolvedValue({
    output: '',
    error: 'fail',
    exitCode: 1,
  });
  const showToast = vi.fn();
  const toast = { showToast };
  const executor = new ScriptExecutor(makeDeps({ executeScript, toast }));
  return {
    executor,
    options: { suppressToast },
    eventContext: {
      ...fakeEventContext,
      toast,
      scriptToasts: {
        ...fakeEventContext.scriptToasts,
        showError: true,
      },
    },
    showToast,
  };
}

describe('script-executor', () => {
  describe('validateScriptPath', () => {
    it('rejects empty string', () => {
      expect(validateScriptPath('')).toBe(false);
    });

    it('rejects path with ..', () => {
      expect(validateScriptPath('../evil.sh')).toBe(false);
      expect(validateScriptPath('foo/../bar.sh')).toBe(false);
    });

    it('rejects absolute paths', () => {
      expect(validateScriptPath('/usr/bin/test')).toBe(false);
    });

    it('rejects paths starting with ~', () => {
      expect(validateScriptPath('~/scripts/test.sh')).toBe(false);
    });

    it('rejects Windows absolute paths', () => {
      expect(validateScriptPath('C:\\scripts\\test.sh')).toBe(false);
    });

    it('rejects paths with backslashes', () => {
      expect(validateScriptPath('foo\\bar.sh')).toBe(false);
    });

    it('accepts valid relative paths', () => {
      expect(validateScriptPath('hooks/test.sh')).toBe(true);
      expect(validateScriptPath('simple.sh')).toBe(true);
    });
  });

  describe('sanitizeArg', () => {
    it('escapes shell special characters', () => {
      expect(sanitizeArg('hello;rm -rf')).toBe('hello\\;rm -rf');
    });

    it('leaves normal args unchanged', () => {
      expect(sanitizeArg('hello world')).toBe('hello world');
    });
  });

  describe('resolveScriptPath', () => {
    it('joins cwd scripts dir with script path', () => {
      const result = resolveScriptPath('test.sh');
      expect(result).toContain(process.cwd());
      expect(result).toContain('test.sh');
    });
  });

  describe('ScriptExecutor.execute', () => {
    it('returns undefined output when subagent and runOnlyOnce', async () => {
      const isSubagent = vi.fn().mockReturnValue(true);
      const executor = new ScriptExecutor(makeDeps({ isSubagent }));
      const result = await executor.execute(
        'test.sh',
        undefined,
        { runOnlyOnce: true },
        fakeEventContext
      );
      expect(result.output).toBeUndefined();
    });

    it('executes normally when not subagent', async () => {
      const executeScript = vi.fn().mockResolvedValue({
        output: 'hello',
        error: null,
        exitCode: 0,
      });
      const executor = new ScriptExecutor(makeDeps({ executeScript }));
      const result = await executor.execute(
        'test.sh',
        undefined,
        {},
        fakeEventContext
      );
      expect(result.output).toBe('hello');
    });

    it('passes arg to executeScript when provided', async () => {
      const executeScript = vi.fn().mockResolvedValue({
        output: 'ok',
        error: null,
        exitCode: 0,
      });
      const executor = new ScriptExecutor(makeDeps({ executeScript }));
      await executor.execute('test.sh', 'arg1', {}, fakeEventContext);
      expect(executeScript).toHaveBeenCalledWith('test.sh', 'arg1');
    });

    it('calls without arg when not provided', async () => {
      const executeScript = vi.fn().mockResolvedValue({
        output: 'ok',
        error: null,
        exitCode: 0,
      });
      const executor = new ScriptExecutor(makeDeps({ executeScript }));
      await executor.execute('test.sh', undefined, {}, fakeEventContext);
      expect(executeScript).toHaveBeenCalledWith('test.sh');
    });

    it('returns undefined output on error', async () => {
      const executeScript = vi.fn().mockResolvedValue({
        output: '',
        error: 'boom',
        exitCode: 1,
      });
      const executor = new ScriptExecutor(makeDeps({ executeScript }));
      const result = await executor.execute(
        'fail.sh',
        undefined,
        {},
        fakeEventContext
      );
      expect(result.output).toBeUndefined();
    });

    it('shows toast on error when showError=true and toast available', async () => {
      const { executor, options, eventContext, showToast } =
        createToastErrorTest(false);
      await executor.execute('fail.sh', undefined, options, eventContext);
      expect(showToast).toHaveBeenCalled();
    });

    it('does not toast when suppressToast=true', async () => {
      const { executor, options, eventContext, showToast } =
        createToastErrorTest(true);
      await executor.execute('fail.sh', undefined, options, eventContext);
      expect(showToast).not.toHaveBeenCalled();
    });

    it('audits on error when audit available', async () => {
      const executeScript = vi.fn().mockResolvedValue({
        output: '',
        error: 'err',
        exitCode: 1,
      });
      const logScript = vi.fn().mockResolvedValue(undefined);
      const audit = { logScript };
      const executor = new ScriptExecutor(makeDeps({ executeScript, audit }));
      await executor.execute('fail.sh', undefined, {}, fakeEventContext);
      expect(logScript).toHaveBeenCalled();
    });

    it('audits on success when not skipped', async () => {
      const { executor, logScript } = createScriptExecutorAuditTest(false);
      await executor.execute('ok.sh', undefined, {}, fakeEventContext);
      expect(logScript).toHaveBeenCalled();
    });

    it('skips audit when skipAudit=true', async () => {
      const { executor, logScript } = createScriptExecutorAuditTest(true);
      await executor.execute(
        'ok.sh',
        undefined,
        { skipAudit: true },
        fakeEventContext
      );
      expect(logScript).not.toHaveBeenCalled();
    });

    it('does not audit on success when output is empty', async () => {
      const executeScript = vi.fn().mockResolvedValue({
        output: '',
        error: null,
        exitCode: 0,
      });
      const logScript = vi.fn().mockResolvedValue(undefined);
      const audit = { logScript };
      const executor = new ScriptExecutor(makeDeps({ executeScript, audit }));
      await executor.execute('ok.sh', undefined, {}, fakeEventContext);
      expect(logScript).not.toHaveBeenCalled();
    });

    it('appends to session on success when not skipped', async () => {
      const executeScript = vi.fn().mockResolvedValue({
        output: 'session text',
        error: null,
        exitCode: 0,
      });
      const appendToSession = vi.fn().mockResolvedValue(undefined);
      const session = { appendToSession };
      const executor = new ScriptExecutor(makeDeps({ executeScript, session }));
      await executor.execute('ok.sh', undefined, {}, fakeEventContext);
      expect(appendToSession).toHaveBeenCalledWith('sess-1', 'session text');
    });

    it('skips session append when skipSession=true', async () => {
      const executeScript = vi.fn().mockResolvedValue({
        output: 'text',
        error: null,
        exitCode: 0,
      });
      const appendToSession = vi.fn().mockResolvedValue(undefined);
      const session = { appendToSession };
      const executor = new ScriptExecutor(makeDeps({ executeScript, session }));
      await executor.execute(
        'ok.sh',
        undefined,
        { skipSession: true },
        fakeEventContext
      );
      expect(appendToSession).not.toHaveBeenCalled();
    });

    it('skips session append when output is empty', async () => {
      const executeScript = vi.fn().mockResolvedValue({
        output: '',
        error: null,
        exitCode: 0,
      });
      const appendToSession = vi.fn().mockResolvedValue(undefined);
      const session = { appendToSession };
      const executor = new ScriptExecutor(makeDeps({ executeScript, session }));
      await executor.execute('ok.sh', undefined, {}, fakeEventContext);
      expect(appendToSession).not.toHaveBeenCalled();
    });

    it('does not toast when toast is undefined', async () => {
      const executeScript = vi.fn().mockResolvedValue({
        output: '',
        error: 'err',
        exitCode: 1,
      });
      const executor = new ScriptExecutor(
        makeDeps({ executeScript, toast: undefined })
      );
      await executor.execute(
        'fail.sh',
        undefined,
        { suppressToast: false },
        {
          ...fakeEventContext,
          scriptToasts: {
            ...fakeEventContext.scriptToasts,
            showError: true,
          },
        }
      );
    });
  });
});
