import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fromAny } from '@total-typescript/shoehorn';
import type { TuiToast } from '@opencode-ai/plugin/tui';
import { DEFAULTS } from '.opencode/plugins/core/constants';

import { ToastDirectorImpl } from '.opencode/plugins/features/core/toast-director';

describe('ToastDirectorImpl', () => {
  let showFn: ReturnType<typeof vi.fn>;
  let onToastDropped: (toast: TuiToast) => void;

  beforeEach(() => {
    vi.useFakeTimers();
    showFn = vi.fn();
    onToastDropped = vi.fn() as (toast: TuiToast) => void;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createToast(overrides: Partial<TuiToast> = {}): TuiToast {
    return {
      title: 'Test Toast',
      message: 'Test message',
      variant: 'info' as const,
      duration: 100,
      ...overrides,
    };
  }

  function createDirector(
    opts: Record<string, unknown> = {},
    showFnOverride?: ReturnType<typeof vi.fn>
  ): ToastDirectorImpl {
    return new ToastDirectorImpl(
      fromAny<(toast: TuiToast) => void, ReturnType<typeof vi.fn>>(
        showFnOverride ?? showFn
      ),
      opts,
      onToastDropped
    );
  }

  it('enqueues and processes a toast', async () => {
    const director = createDirector({ staggerMs: 10 });
    director.enqueue(createToast());

    expect(director.pending).toBe(1);
    expect(director.isProcessing).toBe(false);

    await vi.advanceTimersByTimeAsync(10);

    expect(showFn).toHaveBeenCalledTimes(1);
    expect(director.pending).toBe(0);
  });

  it('enforces maxSize by dropping oldest', async () => {
    const director = createDirector({ maxSize: 2 });
    director.enqueue(createToast({ title: 'First' }));
    director.enqueue(createToast({ title: 'Second' }));
    director.enqueue(createToast({ title: 'Third' }));

    expect(director.pending).toBe(2);
  });

  it('respects maxSize=0 and does not enqueue', () => {
    const director = createDirector({ maxSize: 0 });
    director.enqueue(createToast());
    expect(director.pending).toBe(0);
  });

  it('prioritizes error toasts at the front', async () => {
    const director = createDirector({ staggerMs: 10 });
    director.enqueue(createToast({ title: 'Info', variant: 'info' }));
    director.enqueue(createToast({ title: 'Error', variant: 'error' }));

    await vi.advanceTimersByTimeAsync(500);

    expect(showFn).toHaveBeenCalledTimes(2);
    expect(showFn.mock.calls[0][0].title).toBe('Error');
    expect(showFn.mock.calls[1][0].title).toBe('Info');
  });

  it('flush waits for all toasts to be processed', async () => {
    const director = createDirector({ staggerMs: 10 });
    director.enqueue(createToast({ duration: 50 }));
    director.enqueue(createToast({ duration: 50 }));

    const flushPromise = director.flush();

    await vi.advanceTimersByTimeAsync(0);

    expect(director.isProcessing).toBe(true);

    await vi.advanceTimersByTimeAsync(500);

    await flushPromise;
    expect(director.pending).toBe(0);
    expect(director.isProcessing).toBe(false);
  });

  it('flush returns immediately when idle and queue empty', async () => {
    const director = createDirector({});
    await director.flush();
    expect(director.pending).toBe(0);
  });

  it('clear empties the queue and cancels timers', () => {
    const director = createDirector({ staggerMs: 100 });
    director.enqueue(createToast());
    director.enqueue(createToast());

    expect(director.pending).toBe(2);
    director.clear();
    expect(director.pending).toBe(0);
    expect(director.isProcessing).toBe(false);
  });

  it('shutdown flushes then clears', async () => {
    const director = createDirector({ staggerMs: 10 });
    director.enqueue(createToast({ duration: 50 }));

    const shutdownPromise = director.shutdown();

    await vi.advanceTimersByTimeAsync(500);

    await shutdownPromise;
    expect(director.pending).toBe(0);
    expect(director.isProcessing).toBe(false);
  });

  it('handles showFn errors gracefully', async () => {
    const failFn = vi.fn().mockRejectedValue(new Error('show failed'));
    const director = createDirector({ staggerMs: 10 }, failFn);
    director.enqueue(createToast());
    director.enqueue(createToast());

    await vi.advanceTimersByTimeAsync(500);

    expect(failFn).toHaveBeenCalledTimes(2);
    expect(director.pending).toBe(0);
  });

  it('processes toasts with stagger timing', async () => {
    const director = createDirector({ staggerMs: 50 });
    director.enqueue(createToast({ duration: 30 }));
    director.enqueue(createToast({ duration: 30 }));

    await vi.advanceTimersByTimeAsync(50);
    expect(showFn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(80);
    expect(showFn).toHaveBeenCalledTimes(2);
  });

  it('returns pending count', () => {
    const director = createDirector({});
    expect(director.pending).toBe(0);
    director.enqueue(createToast());
    expect(director.pending).toBe(1);
    director.enqueue(createToast());
    expect(director.pending).toBe(2);
  });

  it('returns isProcessing state', async () => {
    const director = createDirector({ staggerMs: 10 });
    expect(director.isProcessing).toBe(false);

    director.enqueue(createToast());

    expect(director.isProcessing).toBe(false);

    await vi.advanceTimersByTimeAsync(200);

    expect(director.isProcessing).toBe(false);
  });

  it('calls onToastDropped when queue overflows', async () => {
    const director = createDirector({ maxSize: 1, staggerMs: 10 });

    director.enqueue(createToast({ title: 'First' }));
    director.enqueue(createToast({ title: 'Second' }));

    expect(onToastDropped).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'First' })
    );

    await vi.advanceTimersByTimeAsync(500);
  });

  it('handles re-entrant enqueue during processing', async () => {
    const reentrantShowFn = vi.fn((t: TuiToast) => {
      if (t.title === 'First') {
        director.enqueue(createToast({ title: 'Re-entrant' }));
      }
    });
    const director = createDirector({ staggerMs: 0 }, reentrantShowFn);
    director.enqueue(createToast({ title: 'First' }));
    director.enqueue(createToast({ title: 'Second' }));

    await vi.advanceTimersByTimeAsync(1000);

    expect(reentrantShowFn).toHaveBeenCalledTimes(3);
  });

  it('uses default duration when toast has none', async () => {
    const director = createDirector({ staggerMs: 0 });

    director.enqueue({
      title: 'No Dur',
      message: 'test',
      variant: 'info' as const,
    });

    await vi.advanceTimersByTimeAsync(0);

    expect(showFn).toHaveBeenCalledTimes(1);
    expect(director.isProcessing).toBe(true);

    await vi.advanceTimersByTimeAsync(DEFAULTS.toast.durations.FIVE_SECONDS);
  });
});
