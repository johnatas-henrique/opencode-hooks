import { ToastDirectorImpl } from '.opencode/plugins/features/core/toast-director';
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

  const waitForIdle = async () => {
    await Promise.resolve();
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

      await director.flush();
      expect(mockShowFn).toHaveBeenCalledTimes(1);
    });
  });
});
