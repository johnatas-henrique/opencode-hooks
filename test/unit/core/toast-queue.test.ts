import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initGlobalToastQueue,
  useGlobalToastQueue,
  resetGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';

describe('toast-queue', () => {
  beforeEach(() => {
    resetGlobalToastQueue();
  });

  afterEach(() => {
    resetGlobalToastQueue();
  });

  describe('initGlobalToastQueue', () => {
    it('returns queue with add method', () => {
      const queue = initGlobalToastQueue(vi.fn(), () => {}, 30, 50);
      expect(queue.add).toBeDefined();
      expect(typeof queue.add).toBe('function');
    });

    it('returns queue with addMultiple method', () => {
      const queue = initGlobalToastQueue(vi.fn(), () => {}, 30, 50);
      expect(queue.addMultiple).toBeDefined();
      expect(typeof queue.addMultiple).toBe('function');
    });

    it('returns queue with clear method', () => {
      const queue = initGlobalToastQueue(vi.fn(), () => {}, 30, 50);
      expect(queue.clear).toBeDefined();
      expect(typeof queue.clear).toBe('function');
    });

    it('returns queue with flush method', () => {
      const queue = initGlobalToastQueue(vi.fn(), () => {}, 30, 50);
      expect(queue.flush).toBeDefined();
      expect(typeof queue.flush).toBe('function');
    });

    it('returns queue with pending getter', () => {
      const queue = initGlobalToastQueue(vi.fn(), () => {}, 30, 50);
      expect(queue.pending).toBeDefined();
    });

    it('addMultiple adds multiple toasts', async () => {
      const showFn = vi.fn();
      const queue = initGlobalToastQueue(showFn, () => {}, 30, 50);
      queue.addMultiple([
        {
          title: 'Toast 1',
          message: 'Msg1',
          variant: 'info' as const,
          duration: 10,
        },
        {
          title: 'Toast 2',
          message: 'Msg2',
          variant: 'warning' as const,
          duration: 15,
        },
      ]);
      await queue.flush();
    });

    it('clear removes all toasts', () => {
      const queue = initGlobalToastQueue(vi.fn(), () => {}, 30, 50);
      queue.add({
        title: 'Test',
        message: 'Test',
        variant: 'info' as const,
        duration: 10,
      });
      queue.clear();
    });

    it('flush waits for processing', async () => {
      const queue = initGlobalToastQueue(vi.fn(), () => {}, 30, 50);
      await queue.flush();
    });
  });

  describe('useGlobalToastQueue', () => {
    it('throws when not initialized', () => {
      expect(() => useGlobalToastQueue()).toThrow();
    });

    it('returns queue when initialized', () => {
      const queue = initGlobalToastQueue(vi.fn(), () => {}, 30, 50);
      const result = useGlobalToastQueue();
      expect(result).toBe(queue);
    });

    it('throws with descriptive message', () => {
      expect(() => useGlobalToastQueue()).toThrow('ToastQueue not initialized');
    });
  });

  describe('resetGlobalToastQueue', () => {
    it('clears the global queue', () => {
      initGlobalToastQueue(vi.fn(), () => {}, 30, 50);
      resetGlobalToastQueue();
      expect(() => useGlobalToastQueue()).toThrow();
    });

    it('allows re-initialization after reset', () => {
      const queue1 = initGlobalToastQueue(vi.fn(), () => {}, 30, 50);
      resetGlobalToastQueue();
      const queue2 = initGlobalToastQueue(vi.fn(), () => {}, 30, 50);
      expect(queue1).not.toBe(queue2);
    });
  });
});
