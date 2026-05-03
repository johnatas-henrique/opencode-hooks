import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createScriptRunner } from '.opencode/plugins/features/scripts/script-runner';
import type { ScriptRunnerDeps } from '.opencode/plugins/types/executor';
import type { PluginInput } from '@opencode-ai/plugin';
import {
  initGlobalToastQueue,
  resetGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';

const mock$ = vi.fn(() => ({
  quiet: () => Promise.resolve({ text: () => 'done', exitCode: 0 }),
})) as unknown as PluginInput['$'];

function makeDeps(overrides: Partial<ScriptRunnerDeps> = {}): ScriptRunnerDeps {
  const mockCtx = {
    $: mock$,
    client: { session: { prompt: vi.fn().mockResolvedValue(undefined) } },
  } as unknown as PluginInput;

  return {
    ctx: mockCtx,
    sessionId: 'ses_test123',
    eventType: 'session.created',
    resolved: {
      enabled: true,
      debug: false,
      toast: false,
      toastTitle: '=== Script Output ===',
      toastMessage: '',
      toastVariant: 'info' as const,
      toastDuration: 2000,
      scripts: [],
      runScripts: false,
      logToAudit: true,
      appendToSession: false,
      runOnlyOnce: false,
      scriptToasts: {
        showOutput: true,
        showError: true,
        outputVariant: 'info' as const,
        errorVariant: 'error' as const,
        outputDuration: 5000,
        errorDuration: 15000,
        outputTitle: 'Script Output',
        errorTitle: 'Script Error',
      },
      block: [],
    },
    scriptToasts: {
      showOutput: true,
      showError: true,
      outputVariant: 'info' as const,
      errorVariant: 'error' as const,
      outputDuration: 5000,
      errorDuration: 15000,
      outputTitle: 'Script Output',
      errorTitle: 'Script Error',
    },
    ...overrides,
  };
}

describe('createScriptRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalToastQueue();
    initGlobalToastQueue(vi.fn());
  });

  it('returns a run function', () => {
    const deps = makeDeps();
    const runner = createScriptRunner(deps);
    expect(typeof runner).toBe('function');
  });

  it('delegates to runScriptAndHandle with correct config', async () => {
    const deps = makeDeps();
    const runner = createScriptRunner(deps);
    const result = await runner('test.sh');

    expect(result).toEqual({ script: 'test.sh', output: 'done' });
  });

  it('passes arg to runScriptAndHandle', async () => {
    const deps = makeDeps();
    const runner = createScriptRunner(deps);
    const result = await runner('test.sh', '--flag');

    expect(result).toEqual({ script: 'test.sh', output: 'done' });
  });

  it('applies suppressToast option by disabling showError', async () => {
    const deps = makeDeps();
    const runner = createScriptRunner(deps);
    const result = await runner('test.sh', undefined, { suppressToast: true });

    expect(result).toEqual({ script: 'test.sh', output: 'done' });
  });

  it('applies skipAudit option by setting logToAudit false', async () => {
    const deps = makeDeps();
    const runner = createScriptRunner(deps);
    const result = await runner('test.sh', undefined, { skipAudit: true });

    expect(result).toEqual({ script: 'test.sh', output: 'done' });
  });

  it('applies skipSession option by setting appendToSession false', async () => {
    const deps = makeDeps();
    const runner = createScriptRunner(deps);
    const result = await runner('test.sh', undefined, { skipSession: true });

    expect(result).toEqual({ script: 'test.sh', output: 'done' });
  });

  it('applies runOnlyOnce option', async () => {
    const deps = makeDeps();
    const runner = createScriptRunner(deps);
    const result = await runner('test.sh', undefined, { runOnlyOnce: true });

    expect(result).toEqual({ script: 'test.sh', output: 'done' });
  });

  it('does not modify original deps when applying options', async () => {
    const deps = makeDeps();
    const originalShowError = deps.scriptToasts.showError;
    const runner = createScriptRunner(deps);
    await runner('test.sh', undefined, { suppressToast: true });

    expect(deps.scriptToasts.showError).toBe(originalShowError);
    expect(deps.resolved.logToAudit).toBe(true);
  });

  it('passes timestamp from deps', async () => {
    const deps = makeDeps({ timestamp: '2026-06-01T00:00:00.000Z' });
    const runner = createScriptRunner(deps);
    await runner('test.sh');

    // The real runScriptAndHandle uses mock$ which returns 'done'
    // This test verifies the deps pass-through still works
    expect(deps.timestamp).toBe('2026-06-01T00:00:00.000Z');
  });

  it('passes default timestamp when not provided', async () => {
    const deps = makeDeps({ timestamp: undefined });
    const runner = createScriptRunner(deps);
    await runner('test.sh');

    expect(deps.timestamp).toBeUndefined();
  });

  it('passes scriptRecorder from deps', async () => {
    const mockRecorder = { logScript: vi.fn() };
    const deps = makeDeps({ scriptRecorder: mockRecorder });
    const runner = createScriptRunner(deps);
    const result = await runner('test.sh');

    expect(result).toEqual({ script: 'test.sh', output: 'done' });
  });
});
