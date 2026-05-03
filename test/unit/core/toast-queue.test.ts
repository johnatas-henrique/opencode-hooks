import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TuiToast } from '@opencode-ai/plugin/tui';

import {
  showToastStaggered,
  createToastQueue,
  initGlobalToastQueue,
  getGlobalToastQueue,
  useGlobalToastQueue,
  resetGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';

describe('showToastStaggered', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a toast with staggering', async () => {
    const showFn = vi.fn();
    const toast: TuiToast = {
      title: 'Test',
      message: 'Message',
      variant: 'info',
      duration: 50,
    };

    const promise = showToastStaggered(showFn, toast, { stagger: true });

    await vi.advanceTimersByTimeAsync(500);

    await promise;
    expect(showFn).toHaveBeenCalledWith(toast);
  });

  it('shows a toast without staggering', async () => {
    const showFn = vi.fn();
    const toast: TuiToast = {
      title: 'Test',
      message: 'Message',
      variant: 'info',
      duration: 50,
    };

    const promise = showToastStaggered(showFn, toast, { stagger: false });

    await vi.advanceTimersByTimeAsync(500);

    await promise;
    expect(showFn).toHaveBeenCalledWith(toast);
  });
});

describe('createToastQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a queue that can add and flush toasts', async () => {
    const showFn = vi.fn();
    const queue = createToastQueue(showFn, { staggerMs: 10, maxSize: 10 });

    queue.add({ title: 'Test', message: 'Msg', variant: 'info', duration: 50 });

    expect(queue.pending).toBe(1);

    await vi.advanceTimersByTimeAsync(500);

    expect(showFn).toHaveBeenCalledTimes(1);
  });

  it('supports addMultiple', () => {
    const showFn = vi.fn();
    const queue = createToastQueue(showFn);
    queue.addMultiple([
      { title: 'A', message: 'a', variant: 'info', duration: 50 },
      { title: 'B', message: 'b', variant: 'info', duration: 50 },
    ]);
    expect(queue.pending).toBe(2);
  });

  it('clear resets the queue', () => {
    const showFn = vi.fn();
    const queue = createToastQueue(showFn);
    queue.add({ title: 'T', message: 'M', variant: 'info', duration: 50 });
    queue.clear();
    expect(queue.pending).toBe(0);
  });
});

describe('global toast queue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGlobalToastQueue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initGlobalToastQueue creates and returns a ToastQueue', () => {
    const showFn = vi.fn();
    const queue = initGlobalToastQueue(showFn);
    expect(queue).toBeDefined();
    expect(typeof queue.add).toBe('function');
    expect(typeof queue.flush).toBe('function');
  });

  it('getGlobalToastQueue returns existing queue', () => {
    const showFn = vi.fn();
    const queue1 = initGlobalToastQueue(showFn);
    const queue2 = getGlobalToastQueue();
    expect(queue2).toBe(queue1);
  });

  it('getGlobalToastQueue creates queue if showFn provided and not initialized', () => {
    resetGlobalToastQueue();
    const showFn = vi.fn();
    const queue = getGlobalToastQueue(showFn);
    expect(queue).toBeDefined();
  });

  it('getGlobalToastQueue throws if not initialized and no showFn', () => {
    resetGlobalToastQueue();
    expect(() => getGlobalToastQueue()).toThrow(
      'ToastQueue not initialized. Call initGlobalToastQueue first.'
    );
  });

  it('useGlobalToastQueue returns existing queue', () => {
    const showFn = vi.fn();
    initGlobalToastQueue(showFn);
    const queue = useGlobalToastQueue();
    expect(queue).toBeDefined();
  });

  it('useGlobalToastQueue throws if not initialized', () => {
    resetGlobalToastQueue();
    expect(() => useGlobalToastQueue()).toThrow(
      'ToastQueue not initialized. Call initGlobalToastQueue first.'
    );
  });

  it('resetGlobalToastQueue clears the global queue', () => {
    const showFn = vi.fn();
    initGlobalToastQueue(showFn);
    resetGlobalToastQueue();
    expect(() => useGlobalToastQueue()).toThrow();
  });

  it('global queue processes toasts', async () => {
    const showFn = vi.fn();
    const queue = initGlobalToastQueue(showFn);
    queue.add({
      title: 'Global',
      message: 'Test',
      variant: 'info',
      duration: 50,
    });

    await vi.advanceTimersByTimeAsync(500);

    expect(showFn).toHaveBeenCalledTimes(1);
  });
});
