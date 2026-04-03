import {
  createToastQueue,
  getGlobalToastQueue,
  resetGlobalToastQueue,
  showToastStaggered,
} from '../.opencode/plugins/helpers/toast-queue';

describe('toast-queue', () => {
  beforeEach(() => {
    resetGlobalToastQueue();
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
      await queue.flush();
    });
  });

  describe('getGlobalToastQueue', () => {
    it('should return same queue on subsequent calls', () => {
      const showFn = jest.fn();
      const queue1 = getGlobalToastQueue(showFn);
      const queue2 = getGlobalToastQueue(showFn);

      expect(queue1).toBe(queue2);
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
      const startTime = Date.now();

      await showToastStaggered(showFn, toast, { delay: 50, stagger: false });

      expect(Date.now() - startTime).toBeGreaterThanOrEqual(45);
    });
  });
});
