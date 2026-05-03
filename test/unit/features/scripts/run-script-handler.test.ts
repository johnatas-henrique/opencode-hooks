import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PluginInput } from '@opencode-ai/plugin';

import {
  isSubagent,
  addSubagentSession,
  runScriptAndHandle,
} from '.opencode/plugins/features/scripts/run-script-handler';
import {
  initGlobalToastQueue,
  resetGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';

describe('isSubagent', () => {
  it('returns false for undefined', () => {
    expect(isSubagent(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isSubagent('')).toBe(false);
  });

  it('returns false for unknown session id', () => {
    expect(isSubagent('ses_unknown')).toBe(false);
  });

  it('returns true after addSubagentSession', () => {
    addSubagentSession('ses_sub');
    expect(isSubagent('ses_sub')).toBe(true);
  });

  it('returns false for non-subagent after adding different one', () => {
    addSubagentSession('ses_sub1');
    expect(isSubagent('ses_sub2')).toBe(false);
  });

  it('tracks multiple sessions', () => {
    addSubagentSession('ses_a');
    addSubagentSession('ses_b');
    expect(isSubagent('ses_a')).toBe(true);
    expect(isSubagent('ses_b')).toBe(true);
  });
});

describe('addSubagentSession', () => {
  it('adds a session to tracking', () => {
    addSubagentSession('ses_new');
    expect(isSubagent('ses_new')).toBe(true);
  });

  it('is idempotent for the same session', () => {
    addSubagentSession('ses_dup');
    addSubagentSession('ses_dup');
    expect(isSubagent('ses_dup')).toBe(true);
  });
});

describe('runScriptAndHandle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalToastQueue();
    initGlobalToastQueue(vi.fn());
  });

  function makeMock$(): unknown {
    return vi.fn(() => ({
      quiet: () => Promise.resolve({ text: () => 'output', exitCode: 0 }),
    }));
  }

  function makeMockCtx(): PluginInput {
    return {
      $: makeMock$() as PluginInput['$'],
      client: { session: { prompt: vi.fn().mockResolvedValue(undefined) } },
    } as unknown as PluginInput;
  }

  function makeBaseConfig(overrides: Record<string, unknown> = {}) {
    return {
      ctx: makeMockCtx(),
      script: 'test.sh',
      scriptArg: undefined as string | undefined,
      timestamp: '2026-01-01T00:00:00.000Z',
      eventType: 'session.created',
      toolName: undefined as string | undefined,
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
      sessionId: 'ses_test',
      ...overrides,
    };
  }

  it('creates ScriptExecutor and returns success result', async () => {
    const config = makeBaseConfig();
    const result = await runScriptAndHandle(config);

    expect(result).toEqual({ script: 'test.sh', output: 'output' });
  });

  it('passes scriptArg to runScript', async () => {
    const config = makeBaseConfig({ scriptArg: '--verbose' });
    const result = await runScriptAndHandle(config);

    expect(result).toEqual({ script: 'test.sh', output: 'output' });
  });

  it('handles error from script execution', async () => {
    const ctx = {
      $: vi.fn(() => ({
        quiet: () => Promise.resolve({ text: () => 'err', exitCode: 1 }),
      })) as unknown as PluginInput['$'],
      client: { session: { prompt: vi.fn().mockResolvedValue(undefined) } },
    } as unknown as PluginInput;

    const result = await runScriptAndHandle({
      ...makeBaseConfig({ script: 'bad.sh' }),
      ctx,
    });

    expect(result.output).toBeUndefined();
  });

  it('uses defaultSessionId when sessionId is not provided', async () => {
    const config = makeBaseConfig({ sessionId: undefined });
    const result = await runScriptAndHandle(config);

    expect(result).toEqual({ script: 'test.sh', output: 'output' });
  });
});
