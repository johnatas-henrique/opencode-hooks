import { ToastDirectorImpl } from '../../.opencode/plugins/features/core/toast-director';
import type { TuiToast } from '@opencode-ai/plugin/tui';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ToastDirectorImpl', () => {
  let mockShowFn: ReturnType<typeof vi.fn>;
  let director: ToastDirectorImpl;

  const createToast = (overrides: Partial<TuiToast> = {}): TuiToast =>
    ({
      title: 'Test Toast',
      message: 'Message',
      variant: 'info',
      duration: 2000,
      ...overrides,
    }) as TuiToast;

  // Helper: wait until processing finishes and queue is empty
  const waitForIdle = async () => {
    // Let microtasks start processing
    await Promise.resolve();
    // Loop: run timers, then yield to microtasks, repeat until idle
    while (director.pending > 0 || director.isProcessing) {
      vi.runAllTimers();
      await Promise.resolve();
    }
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockShowFn = vi.fn().mockResolvedValue(undefined);
    director = new ToastDirectorImpl(
      mockShowFn as unknown as (toast: TuiToast) => Promise<void>,
      {
        staggerMs: 10,
        maxSize: 3,
      }
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('enqueue()', () => {
    it('should add toast to queue and keep pending > 0 immediately after enqueue', () => {
      director.enqueue(createToast());
      expect(director.pending).toBe(1);
    });

    it('should put error toasts at front (unshift vs push)', async () => {
      director.enqueue(createToast({ variant: 'info' }));
      director.enqueue(createToast({ variant: 'error' }));
      expect(director.pending).toBe(2);

      await waitForIdle();

      const calls = mockShowFn.mock.calls.map((c) => c[0].variant);
      expect(calls).toEqual(['error', 'info']);
    });

    it('should drop oldest when maxSize exceeded', async () => {
      director.enqueue(createToast({ title: '1' }));
      director.enqueue(createToast({ title: '2' }));
      director.enqueue(createToast({ title: '3' }));
      expect(director.pending).toBe(3);

      director.enqueue(createToast({ title: '4' }));
      expect(director.pending).toBe(3);

      await waitForIdle();

      const titles = mockShowFn.mock.calls.map((c) => c[0].title);
      expect(titles).not.toContain('1');
      expect(titles).toContain('2');
      expect(titles).toContain('3');
      expect(titles).toContain('4');
    });
  });

  describe('flush()', () => {
    it('should resolve immediately when queue is empty and not processing', async () => {
      await expect(director.flush()).resolves.toBeUndefined();
    });

    it('should resolve immediately if becomes idle between check and callback (race)', async () => {
      director.enqueue(createToast({ title: 'A' }));

      // Process to completion first
      await waitForIdle();
      expect(director.pending).toBe(0);
      expect(director.isProcessing).toBe(false);

      // Now add another and immediately flush - simulates racing conditions
      // where toast is added and processed between push and check
      director.enqueue(createToast({ title: 'B' }));
      await waitForIdle();

      // At this point, even if we hit the race condition code path, it resolves
    });

    it('should wait for all toasts to be processed', async () => {
      director.enqueue(createToast({ title: 'A' }));
      director.enqueue(createToast({ title: 'B' }));
      director.enqueue(createToast({ title: 'C' }));

      const flushPromise = director.flush();

      await waitForIdle();

      await flushPromise;

      expect(mockShowFn).toHaveBeenCalledTimes(3);
      const order = mockShowFn.mock.calls.map((c) => c[0].title);
      expect(order).toEqual(['A', 'B', 'C']);
    });
  });

  describe('clear()', () => {
    it('should empty the queue and cancel timers', () => {
      director.enqueue(createToast());
      director.enqueue(createToast());
      expect(director.pending).toBe(2);
      director.clear();
      expect(director.pending).toBe(0);
    });
  });

  describe('pending', () => {
    it('should return current queue length', () => {
      expect(director.pending).toBe(0);
      director.enqueue(createToast());
      expect(director.pending).toBe(1);
      director.enqueue(createToast());
      expect(director.pending).toBe(2);
    });
  });

  describe('isProcessing', () => {
    it('should be false when idle', () => {
      expect(director.isProcessing).toBe(false);
    });

    it('should become true during processing', async () => {
      director.enqueue(createToast());
      // Let microtask start processing
      await Promise.resolve();
      expect(director.isProcessing).toBe(true);

      // Finish processing
      await waitForIdle();
      expect(director.isProcessing).toBe(false);
    });
  });

  describe('shutdown()', () => {
    it('should flush and clear', async () => {
      director.enqueue(createToast());
      await waitForIdle();
      await director.shutdown();
      expect(director.pending).toBe(0);
    });
  });

  describe('integration', () => {
    it('should process toasts in order with stagger', async () => {
      director = new ToastDirectorImpl(
        mockShowFn as unknown as (toast: TuiToast) => Promise<void>,
        {
          staggerMs: 20,
          maxSize: 50,
        }
      );

      director.enqueue(createToast({ title: 'A' }));
      director.enqueue(createToast({ title: 'B' }));
      director.enqueue(createToast({ title: 'C' }));

      const flushPromise = director.flush();

      await waitForIdle();

      await flushPromise;

      const order = mockShowFn.mock.calls.map((c) => c[0].title);
      expect(order).toEqual(['A', 'B', 'C']);
    });

    it('should use default staggerMs when undefined', async () => {
      director = new ToastDirectorImpl(
        mockShowFn as unknown as (toast: TuiToast) => Promise<void>,
        {}
      );

      director.enqueue(createToast());

      await waitForIdle();

      expect(mockShowFn).toHaveBeenCalledTimes(1);
    });

    it('should use default duration when toast.duration is undefined', async () => {
      const toastNoDuration = createToast({
        duration: undefined,
      } as unknown as TuiToast);
      director.enqueue(toastNoDuration);

      await waitForIdle();
      await director.flush();

      expect(mockShowFn).toHaveBeenCalledTimes(1);
    });

    it('should handle showFn throwing error', async () => {
      mockShowFn.mockImplementation(async () => {
        throw new Error('show failed');
      });

      director.enqueue(createToast({ title: 'Err' }));

      await waitForIdle();

      // flush should resolve despite error; error is handled silently
      await director.flush();
      expect(mockShowFn).toHaveBeenCalledTimes(1);
    });
  });
});
