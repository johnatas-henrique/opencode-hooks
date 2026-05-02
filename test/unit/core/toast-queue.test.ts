import { vi } from 'vitest';
import {
  createToastQueue,
  getGlobalToastQueue,
  resetGlobalToastQueue,
  showToastStaggered,
  useGlobalToastQueue,
  initGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';
import { DEFAULTS } from '.opencode/plugins/core/constants';
vi.mock('.opencode/plugins/features/audit/plugin-integration', () => ({
  getErrorRecorder: vi.fn(() => ({
    logError: vi.fn(),
  })),
  initAuditLogging: vi.fn(),
  getScriptRecorder: vi.fn(),
  resetAuditLogging: vi.fn(),
  getLastKnownSessionId: vi.fn().mockReturnValue('ses_test123'),
}));

describe('toast-queue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGlobalToastQueue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initGlobalToastQueue', () => {
    it('should return queue with working add, addMultiple, clear, flush, pending', async () => {
      const showFn = vi.fn();
      const queue = initGlobalToastQueue(showFn);

      queue.add({ title: 't1', message: 'm', variant: 'info' as const });
      expect(queue.pending).toBe(1);

      queue.addMultiple([
        { title: 't2', message: 'm', variant: 'info' as const },
      ]);
      expect(queue.pending).toBe(2);

      await vi.runAllTimersAsync();
      await queue.flush();

      queue.clear();
      expect(queue.pending).toBe(0);
    });
  });
});

describe('queue backpressure', () => {
  it('should handle error toasts in addMultiple when queue is full', () => {
    const showFn = vi.fn();
    const queue = createToastQueue(showFn, {
      maxSize: 2,
      staggerMs: 999999,
    });

    queue.addMultiple([
      { title: '1', message: 'msg', variant: 'info' as const },
      { title: '2', message: 'msg', variant: 'info' as const },
      { title: '3', message: 'msg', variant: 'error' as const },
    ]);

    expect(queue.pending).toBeLessThanOrEqual(2);
  });
});

describe('getGlobalToastQueue error branches', () => {
  it('should throw when globalToastQueue is null and no showFn', () => {
    resetGlobalToastQueue();
    expect(() => getGlobalToastQueue()).toThrow('ToastQueue not initialized');
    resetGlobalToastQueue();
  });

  it('should throw in useGlobalToastQueue when not initialized', () => {
    resetGlobalToastQueue();
    expect(() => useGlobalToastQueue()).toThrow('ToastQueue not initialized');
    resetGlobalToastQueue();
  });
});

describe('createToastQueue flush during processing', () => {
  it('should await processingLock when flush called while queue is processing', async () => {
    vi.useFakeTimers();
    const showFn = vi.fn();

    let resolveShow!: (value: void) => void;
    const showPromise = new Promise<void>((resolve) => {
      resolveShow = resolve;
    });
    showFn.mockReturnValue(showPromise);

    const queue = createToastQueue(showFn, { staggerMs: 10 });

    queue.add({ title: 'Test', message: 'msg', variant: 'info' as const });

    const flushPromise = queue.flush();

    await vi.advanceTimersByTimeAsync(10);
    expect(showFn).toHaveBeenCalledTimes(1);

    resolveShow();

    await vi.advanceTimersByTimeAsync(5000);

    await flushPromise;
    expect(showFn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

describe('getGlobalToastQueue without showFn after init', () => {
  it('should return the same global queue when called without showFn after initialization', () => {
    resetGlobalToastQueue();
    const showFn = vi.fn();
    const queue1 = getGlobalToastQueue(showFn);
    const queue2 = getGlobalToastQueue();
    expect(queue2).toBe(queue1);
    resetGlobalToastQueue();
  });
});

describe('dropped toast branch coverage with maxSize=0', () => {
  it('should handle addMultiple when maxSize=0 and dropped is undefined (line 113)', () => {
    const showFn = vi.fn();
    const queue = createToastQueue(showFn, {
      maxSize: 0,
      staggerMs: 999999,
    });

    queue.addMultiple([
      { title: '1', message: 'msg', variant: 'info' as const },
    ]);
    expect(queue.pending).toBe(0);
  });
});

describe('processQueue line 53 - queue empty after await processingLock', () => {
  it('should hit line 53 when queue empties while waiting for processingLock', async () => {
    vi.useFakeTimers();
    let resolveShow!: () => void;
    const showPromise = new Promise<void>((resolve) => {
      resolveShow = resolve;
    });
    const showFn = vi.fn().mockReturnValue(showPromise);

    const queue = createToastQueue(showFn, { staggerMs: 10 });

    queue.add({ title: '1', message: 'msg', variant: 'info' as const });

    await vi.advanceTimersByTimeAsync(10);
    expect(showFn).toHaveBeenCalledTimes(1);

    queue.add({ title: '2', message: 'msg', variant: 'info' as const });

    queue.clear();

    resolveShow();

    await vi.advanceTimersByTimeAsync(5000);

    expect(queue.pending).toBe(0);
    vi.useRealTimers();
  });
});

describe('showToastStaggered stagger branch coverage', () => {
  it('should cover stagger branch when stagger=true and activeToast exists (lines 16-21)', async () => {
    vi.useFakeTimers();
    let resolveFirst!: () => void;
    const firstPromise = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    const showFn = vi.fn().mockImplementationOnce(() => firstPromise);

    showToastStaggered(
      showFn,
      { title: '1', message: 'msg', variant: 'info' as const },
      { stagger: false }
    );

    const p2 = showToastStaggered(
      showFn,
      { title: '2', message: 'msg', variant: 'info' as const },
      { stagger: true }
    );

    resolveFirst();
    await vi.advanceTimersByTimeAsync(DEFAULTS.toast.stagger.DEFAULT);
    await vi.advanceTimersByTimeAsync(DEFAULTS.toast.durations.FIVE_SECONDS);
    await p2;
    expect(showFn).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
