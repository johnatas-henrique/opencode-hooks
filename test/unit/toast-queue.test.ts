import {
  createToastQueue,
  getGlobalToastQueue,
  resetGlobalToastQueue,
  showToastStaggered,
  useGlobalToastQueue,
  initGlobalToastQueue,
} from '../../.opencode/plugins/core/toast-queue';

describe('toast-queue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGlobalToastQueue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createToastQueue', () => {
    it('should clear queue', () => {
      const showFn = vi.fn();
      const queue = createToastQueue(showFn);

      queue.add({
        title: 'Test',
        message: 'Message',
        variant: 'info' as const,
        duration: 3000,
      });
      queue.clear();

      expect(queue.pending).toBe(0);
    });

    it('should handle flush when queue is empty', async () => {
      const showFn = vi.fn();
      const queue = createToastQueue(showFn);

      await queue.flush();

      expect(showFn).not.toHaveBeenCalled();
    });

    it('should return early when processingLock exists and queue is empty', async () => {
      const showFn = vi.fn().mockResolvedValue(undefined);
      const queue = createToastQueue(showFn, { staggerMs: 10 });

      // Add to trigger processing
      queue.add({ title: 'Test', message: 'Msg', variant: 'info' as const });
      // Wait for processing to start but not complete
      await vi.advanceTimersByTimeAsync(5);

      // Add again while processing (to test early return when queue is empty)
      queue.add({ title: 'Test2', message: 'Msg2', variant: 'info' as const });

      await vi.runAllTimersAsync();
    });
  });

  describe('getGlobalToastQueue', () => {
    it('should return same queue on subsequent calls', () => {
      const showFn = vi.fn();
      const queue1 = getGlobalToastQueue(showFn);
      const queue2 = getGlobalToastQueue(showFn);

      expect(queue1).toBe(queue2);
    });

    it('should throw error when not initialized and no showFn provided', () => {
      resetGlobalToastQueue();
      expect(() => getGlobalToastQueue()).toThrow(
        'ToastQueue not initialized. Call initGlobalToastQueue first.'
      );
    });
  });

  describe('useGlobalToastQueue', () => {
    beforeEach(() => {
      resetGlobalToastQueue();
    });

    it('should throw error when not initialized', () => {
      resetGlobalToastQueue();
      expect(() => useGlobalToastQueue()).toThrow(
        'ToastQueue not initialized. Call initGlobalToastQueue first.'
      );
    });
  });

  describe('initGlobalToastQueue', () => {
    it('should initialize the global queue', () => {
      const showFn = vi.fn();
      const queue = initGlobalToastQueue(showFn);

      expect(queue).toBeDefined();
      expect(useGlobalToastQueue()).toBe(queue);
    });
  });

  describe('showToastStaggered', () => {
    it('should respect delay option', async () => {
      const showFn = vi.fn();
      const toast = {
        title: 'Test',
        message: 'Message',
        variant: 'info' as const,
        duration: 3000,
      };

      const promise = showToastStaggered(showFn, toast, {
        delay: 50,
        stagger: false,
      });
      await vi.runAllTimersAsync();
      await promise;

      expect(showFn).toHaveBeenCalledWith(toast);
    });

    it('should wait for activeToast when stagger is true', async () => {
      const showFn = vi.fn();
      const toast1 = {
        title: 'Test 1',
        message: 'Message 1',
        variant: 'info' as const,
        duration: 10,
      };
      const toast2 = {
        title: 'Test 2',
        message: 'Message 2',
        variant: 'info' as const,
        duration: 10,
      };

      const promise1 = showToastStaggered(showFn, toast1, { stagger: true });
      const promise2 = showToastStaggered(showFn, toast2, { stagger: true });

      await vi.runAllTimersAsync();

      await Promise.all([promise1, promise2]);
      expect(showFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('queue backpressure', () => {
    it('should drop oldest toast when queue is full', () => {
      const showFn = vi.fn();
      const queue = createToastQueue(showFn, {
        maxSize: 2,
        staggerMs: 999999,
      });

      queue.add({ title: '1', message: 'msg', variant: 'info' as const });
      queue.add({ title: '2', message: 'msg', variant: 'info' as const });
      queue.add({ title: '3', message: 'msg', variant: 'info' as const });
      queue.add({ title: '4', message: 'msg', variant: 'info' as const });

      expect(queue.pending).toBeLessThanOrEqual(2);
    });

    it('should handle error toast when queue is full', () => {
      const showFn = vi.fn();
      const queue = createToastQueue(showFn, {
        maxSize: 2,
        staggerMs: 999999,
      });

      queue.add({ title: '1', message: 'msg', variant: 'info' as const });
      queue.add({ title: '2', message: 'msg', variant: 'info' as const });
      queue.add({ title: '3', message: 'msg', variant: 'error' as const });

      expect(queue.pending).toBeLessThanOrEqual(2);
    });

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

    it('should flush wait for processing lock', async () => {
      const showFn = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 10))
        );
      const queue = createToastQueue(showFn, { staggerMs: 10 });

      queue.add({
        title: 'Test',
        message: 'Msg',
        variant: 'info' as const,
        duration: 10,
      });

      const flushPromise = queue.flush();
      await vi.runAllTimersAsync();
      await flushPromise;

      expect(queue.pending).toBe(0);
    });
  });
});
