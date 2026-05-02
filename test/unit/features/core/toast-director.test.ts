import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TuiToast } from '@opencode-ai/plugin/tui';
import { ToastDirectorImpl } from '.opencode/plugins/features/core/toast-director';

describe('ToastDirectorImpl', () => {
  const mockShowFn = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enqueues and processes a single toast', async () => {
    vi.useFakeTimers();
    const director = new ToastDirectorImpl(mockShowFn, {
      staggerMs: 0,
    });
    const toast: TuiToast = {
      title: 'Test',
      message: 'msg',
      variant: 'info',
      duration: 10,
    };

    director.enqueue(toast);
    await vi.advanceTimersByTimeAsync(50);
    await director.flush();

    expect(mockShowFn).toHaveBeenCalledWith(toast);
  });

  it('does not enqueue when maxSize is 0', () => {
    const director = new ToastDirectorImpl(mockShowFn, { maxSize: 0 });
    director.enqueue({ title: 'T', message: 'm', variant: 'info' });
    expect(director.pending).toBe(0);
  });

  it('clears all pending toasts', () => {
    const director = new ToastDirectorImpl(mockShowFn);
    director.enqueue({ title: 'T1', message: 'm1', variant: 'info' });
    director.enqueue({ title: 'T2', message: 'm2', variant: 'info' });

    director.clear();
    expect(director.pending).toBe(0);
    expect(director.isProcessing).toBe(false);
  });

  it('returns correct pending count', () => {
    const director = new ToastDirectorImpl(mockShowFn);
    director.enqueue({ title: 'T1', message: 'm1', variant: 'info' });
    expect(director.pending).toBe(1);
    director.enqueue({ title: 'T2', message: 'm2', variant: 'info' });
    expect(director.pending).toBe(2);
  });

  it('flush returns immediately when idle', async () => {
    const director = new ToastDirectorImpl(mockShowFn);
    await director.flush();
  });

  it('uses default duration when toast has none', async () => {
    vi.useFakeTimers();
    const director = new ToastDirectorImpl(mockShowFn, { staggerMs: 0 });
    director.enqueue({ title: 'T', message: 'm', variant: 'info' });

    await vi.advanceTimersByTimeAsync(5100);
    await director.flush();

    expect(mockShowFn).toHaveBeenCalled();
  });

  it('processes toasts in order', async () => {
    vi.useFakeTimers();
    const director = new ToastDirectorImpl(mockShowFn, { staggerMs: 0 });
    director.enqueue({
      title: 'T1',
      message: 'm1',
      variant: 'info',
      duration: 10,
    });
    director.enqueue({
      title: 'T2',
      message: 'm2',
      variant: 'info',
      duration: 10,
    });

    await vi.advanceTimersByTimeAsync(100);
    await director.flush();

    expect(mockShowFn).toHaveBeenCalledTimes(2);
    expect(mockShowFn.mock.calls[0][0].title).toBe('T1');
    expect(mockShowFn.mock.calls[1][0].title).toBe('T2');
  });

  it('handles showFn error without stopping queue', async () => {
    vi.useFakeTimers();
    const failingShowFn = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error('fail')))
      .mockResolvedValue(undefined);

    const director = new ToastDirectorImpl(failingShowFn, { staggerMs: 0 });
    director.enqueue({
      title: 'T1',
      message: 'm1',
      variant: 'info',
      duration: 10,
    });
    director.enqueue({
      title: 'T2',
      message: 'm2',
      variant: 'info',
      duration: 10,
    });

    await vi.advanceTimersByTimeAsync(200);
    await director.flush();

    expect(failingShowFn).toHaveBeenCalledTimes(2);
  });

  it('shutdown flushes and clears', async () => {
    vi.useFakeTimers();
    const director = new ToastDirectorImpl(mockShowFn, { staggerMs: 0 });
    director.enqueue({
      title: 'T1',
      message: 'm1',
      variant: 'info',
      duration: 10,
    });

    await vi.advanceTimersByTimeAsync(50);
    await director.shutdown();
    expect(director.pending).toBe(0);
  });

  it('drops oldest when queue is full', async () => {
    vi.useFakeTimers();
    const director = new ToastDirectorImpl(mockShowFn, {
      maxSize: 2,
      staggerMs: 0,
    });
    director.enqueue({ title: 'T1', message: 'm1', variant: 'info' });
    director.enqueue({ title: 'T2', message: 'm2', variant: 'info' });
    director.enqueue({ title: 'T3', message: 'm3', variant: 'info' });

    expect(director.pending).toBe(2);

    await vi.runAllTimersAsync();
    await director.flush();

    expect(mockShowFn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
