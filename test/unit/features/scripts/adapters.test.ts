import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fromAny, fromPartial } from '@total-typescript/shoehorn';
import type { PluginInput } from '@opencode-ai/plugin';
import {
  initGlobalToastQueue,
  resetGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';
import { DEFAULTS } from '.opencode/plugins/core/constants';

import {
  createToastAdapter,
  createSessionAdapter,
  createAuditAdapter,
} from '.opencode/plugins/features/scripts/adapters';

describe('createToastAdapter', () => {
  beforeEach(() => {
    resetGlobalToastQueue();
  });

  it('calls useGlobalToastQueue().add with provided params', async () => {
    const showFn = vi.fn();
    initGlobalToastQueue(showFn);
    vi.useFakeTimers();

    const adapter = createToastAdapter();
    adapter.showToast('Title', 'Message', 'info', 5000);

    await vi.advanceTimersByTimeAsync(DEFAULTS.toast.stagger.DEFAULT + 100);

    expect(showFn).toHaveBeenCalledWith({
      title: 'Title',
      message: 'Message',
      variant: 'info',
      duration: 5000,
    });

    vi.useRealTimers();
  });

  it('passes any variant and duration correctly', async () => {
    const showFn = vi.fn();
    initGlobalToastQueue(showFn);
    vi.useFakeTimers();

    const adapter = createToastAdapter();
    adapter.showToast('Error', 'Something broke', 'error', 15000);

    await vi.advanceTimersByTimeAsync(DEFAULTS.toast.stagger.DEFAULT + 100);

    expect(showFn).toHaveBeenCalledWith({
      title: 'Error',
      message: 'Something broke',
      variant: 'error',
      duration: 15000,
    });

    vi.useRealTimers();
  });
});

describe('createSessionAdapter', () => {
  it('creates appendToSession that delegates to appendToSession with ctx', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const ctx = fromPartial<PluginInput>({
      $: fromAny<PluginInput['$'], ReturnType<typeof vi.fn>>(vi.fn()),
      client: { session: { prompt: mockPrompt } },
    });

    const adapter = createSessionAdapter({
      ctx,
      script: 'test.sh',
      timestamp: '123',
      eventType: 'session.created',
      resolved: {
        enabled: true,
        debug: false,
        toast: false,
        toastTitle: '',
        toastMessage: '',
        toastVariant: 'info',
        toastDuration: 2000,
        scripts: [],
        runScripts: false,
        logToAudit: true,
        appendToSession: false,
        runOnlyOnce: false,
        scriptToasts: {
          showOutput: true,
          showError: true,
          outputVariant: 'info',
          errorVariant: 'error',
          outputDuration: 5000,
          errorDuration: 15000,
          outputTitle: 'Output',
          errorTitle: 'Error',
        },
      },
      scriptToasts: {
        showOutput: true,
        showError: true,
        outputVariant: 'info',
        errorVariant: 'error',
        outputDuration: 5000,
        errorDuration: 15000,
        outputTitle: 'Output',
        errorTitle: 'Error',
      },
    });

    await adapter.appendToSession('ses_1', 'hello');

    expect(mockPrompt).toHaveBeenCalledWith({
      path: { id: 'ses_1' },
      body: {
        noReply: true,
        parts: [{ type: 'text', text: 'hello' }],
      },
    });
  });
});

describe('createAuditAdapter', () => {
  it('returns undefined when no recorder provided', () => {
    expect(createAuditAdapter()).toBeUndefined();
    expect(createAuditAdapter(undefined)).toBeUndefined();
  });

  it('wraps scriptRecorder.logScript', async () => {
    const mockLogScript = vi.fn().mockResolvedValue(undefined);
    const recorder = { logScript: mockLogScript };

    const adapter = createAuditAdapter(recorder)!;
    expect(adapter).toBeDefined();
    const input = { script: 'test.sh', args: [] as string[], startTime: 1000 };
    const result = { output: 'ok', error: null, exitCode: 0 };
    await adapter.logScript(input, result);

    expect(mockLogScript).toHaveBeenCalledWith(input, result);
  });
});
