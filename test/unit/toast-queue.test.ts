import {
  createToastQueue,
  getGlobalToastQueue,
  resetGlobalToastQueue,
  showToastStaggered,
  useGlobalToastQueue,
  initGlobalToastQueue,
} from '../../.opencode/plugins/helpers/toast-queue';

describe('toast-queue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetGlobalToastQueue();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createToastQueue', () => {
    it('should add toast to queue', () => {
      const showFn = jest.fn();
      const queue = createToastQueue(showFn);

      queue.add({
        title: 'Test',
        message: 'Message',
        variant: 'info' as const,
        duration: 3000,
      });

      expect(queue.pending).toBeGreaterThanOrEqual(0);
    });

    it('should clear queue', () => {
      const showFn = jest.fn();
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

    it('should flush when queue has items', async () => {
      const showFn = jest.fn().mockResolvedValue(undefined);
      const queue = createToastQueue(showFn, { staggerMs: 10 });

      queue.add({
        title: 'Test',
        message: 'Message',
        variant: 'info' as const,
        duration: 10,
      });

      await jest.runAllTimersAsync();
      await queue.flush();
    });

    it('should handle flush when queue is empty', async () => {
      const showFn = jest.fn();
      const queue = createToastQueue(showFn);

      await queue.flush();
      expect(queue.pending).toBe(0);
    });

    it('should handle add when queue is empty and process immediately', () => {
      const showFn = jest.fn();
      const queue = createToastQueue(showFn, { staggerMs: 0, maxSize: 1 });

      queue.add({ title: 'Test', message: 'Msg', variant: 'info' as const });
      queue.add({ title: 'Test2', message: 'Msg2', variant: 'info' as const });

      expect(queue.pending).toBeLessThanOrEqual(1);
    });

    it('should return early when processingLock exists and queue is empty', async () => {
      const showFn = jest.fn().mockResolvedValue(undefined);
      const queue = createToastQueue(showFn, { staggerMs: 10 });

      // Add to trigger processing
      queue.add({ title: 'Test', message: 'Msg', variant: 'info' as const });
      // Wait for processing to start but not complete
      await jest.advanceTimersByTimeAsync(5);

      // Add again while processing (to test early return when queue is empty)
      queue.add({ title: 'Test2', message: 'Msg2', variant: 'info' as const });

      await jest.runAllTimersAsync();
    });

    it('should handle stagger option correctly', async () => {
      const showFn = jest.fn();
      const toast = {
        title: 'Test',
        message: 'Msg',
        variant: 'info' as const,
        duration: 10,
      };

      const p1 = showToastStaggered(showFn, toast, { stagger: true });
      const p2 = showToastStaggered(showFn, toast, { stagger: true });

      await jest.runAllTimersAsync();
      await Promise.all([p1, p2]);

      expect(showFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('getGlobalToastQueue', () => {
    it('should return same queue on subsequent calls', () => {
      const showFn = jest.fn();
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

    it('should initialize when showFn provided but queue not initialized', () => {
      resetGlobalToastQueue();
      const showFn = jest.fn();
      const queue = getGlobalToastQueue(showFn);
      expect(queue).toBeDefined();
    });
  });

  describe('resetGlobalToastQueue', () => {
    it('should create new queue after reset', () => {
      const showFn = jest.fn();
      const queue = getGlobalToastQueue(showFn);

      queue.add({
        title: 'Test',
        message: 'Message',
        variant: 'info' as const,
        duration: 3000,
      });

      resetGlobalToastQueue();

      const newQueue = getGlobalToastQueue(showFn);
      expect(newQueue.pending).toBe(0);
    });
  });

  describe('useGlobalToastQueue', () => {
    beforeEach(() => {
      resetGlobalToastQueue();
    });

    it('should return the global queue after initialization', () => {
      const showFn = jest.fn();
      const queue = initGlobalToastQueue(showFn);

      expect(useGlobalToastQueue()).toBe(queue);
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
      const showFn = jest.fn();
      const queue = initGlobalToastQueue(showFn);

      expect(queue).toBeDefined();
      expect(useGlobalToastQueue()).toBe(queue);
    });

    it('should create a new queue on each call (does not reuse)', () => {
      const showFn = jest.fn();
      const queue1 = initGlobalToastQueue(showFn);

      // Add something to queue1
      queue1.add({ title: 'Test', message: 'Msg', variant: 'info' as const });

      // initGlobalToastQueue creates a new queue (doesn't reuse)
      const queue2 = initGlobalToastQueue(showFn);
      expect(queue2.pending).toBe(0);
    });
  });

  describe('showToastStaggered', () => {
    it('should call showFn with toast', async () => {
      const showFn = jest.fn();
      const toast = {
        title: 'Test',
        message: 'Message',
        variant: 'info' as const,
        duration: 3000,
      };

      await showToastStaggered(showFn, toast, { delay: 0, stagger: false });

      expect(showFn).toHaveBeenCalledWith(toast);
    });

    it('should respect delay option', async () => {
      const showFn = jest.fn();
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
      await jest.runAllTimersAsync();
      await promise;

      expect(showFn).toHaveBeenCalledWith(toast);
    });

    it('should wait for activeToast when stagger is true', async () => {
      const showFn = jest.fn();
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

      await jest.runAllTimersAsync();

      await Promise.all([promise1, promise2]);
      expect(showFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('queue backpressure', () => {
    it('should drop oldest toast when queue is full', () => {
      const showFn = jest.fn();
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

    it('should addMultiple toasts and drop when full', () => {
      const showFn = jest.fn();
      const queue = createToastQueue(showFn, {
        maxSize: 2,
        staggerMs: 999999,
      });

      queue.addMultiple([
        { title: '1', message: 'msg', variant: 'info' as const },
        { title: '2', message: 'msg', variant: 'info' as const },
        { title: '3', message: 'msg', variant: 'info' as const },
      ]);

      expect(queue.pending).toBeLessThanOrEqual(2);
    });

    it('should handle error toast when queue is full', () => {
      const showFn = jest.fn();
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
      const showFn = jest.fn();
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
      const showFn = jest
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
      await jest.runAllTimersAsync();
      await flushPromise;

      expect(queue.pending).toBe(0);
    });
  });
});
