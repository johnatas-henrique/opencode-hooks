import { createToastQueue } from '../../.opencode/plugins/core/toast-queue';
import { vi, beforeEach, afterEach, expect, describe, it } from 'vitest';

vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: vi.fn(),
}));

const { saveToFile } =
  await import('../../.opencode/plugins/features/persistence/save-to-file');

describe('toast queue concurrency integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('re-entry lock (lines 53-59)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should wait for existing processing lock before adding new toast', async () => {
      vi.useFakeTimers();

      const showFn = vi.fn();
      showFn.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const queue = createToastQueue(showFn, {
        staggerMs: 0,
        maxSize: 5,
      });

      queue.add({
        title: 'Toast 1',
        message: 'test',
        variant: 'info',
      });

      await vi.runAllTimersAsync();

      queue.add({
        title: 'Toast 2',
        message: 'test',
        variant: 'info',
      });

      await vi.runAllTimersAsync();

      expect(showFn).toHaveBeenCalledTimes(2);
    });

    it('should return early if queue becomes empty during lock wait', async () => {
      vi.useFakeTimers();

      const showFn = vi.fn().mockResolvedValue(undefined);

      const queue = createToastQueue(showFn, {
        staggerMs: 0,
        maxSize: 5,
      });

      queue.add({
        title: 'First toast',
        message: 'test',
        variant: 'info',
      });

      await vi.runAllTimersAsync();

      queue.add({
        title: 'Second toast',
        message: 'test',
        variant: 'info',
      });

      await vi.runAllTimersAsync();

      expect(showFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('queue full - dropped toasts (line 97)', () => {
    it('should log dropped toast when queue exceeds maxSize', async () => {
      vi.mocked(saveToFile).mockResolvedValue(undefined);

      const showFn = vi.fn().mockResolvedValue(undefined);

      const maxSize = 2;
      const queue = createToastQueue(showFn, {
        staggerMs: 0,
        maxSize,
      });

      for (let i = 0; i < 4; i++) {
        queue.add({
          title: `Toast ${i}`,
          message: 'test',
          variant: 'info',
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(saveToFile).toHaveBeenCalled();

      const calls = vi.mocked(saveToFile).mock.calls;
      const droppedToastCalls = calls.filter((call) =>
        JSON.stringify(call[0]).includes('QUEUE_ERROR')
      );

      expect(droppedToastCalls.length).toBeGreaterThan(0);

      const dropData = JSON.parse(droppedToastCalls[0][0].content);
      expect(dropData.type).toBe('QUEUE_ERROR');
    });

    it('should use default session ID for dropped toast with no title', async () => {
      vi.mocked(saveToFile).mockResolvedValue(undefined);

      const showFn = vi.fn().mockResolvedValue(undefined);

      const maxSize = 2;
      const queue = createToastQueue(showFn, {
        staggerMs: 0,
        maxSize,
      });

      for (let i = 0; i < 4; i++) {
        queue.add({
          title: '',
          message: 'test',
          variant: 'info',
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(saveToFile).toHaveBeenCalled();

      const calls = vi.mocked(saveToFile).mock.calls;
      const droppedToastCalls = calls.filter((call) =>
        JSON.stringify(call[0]).includes('QUEUE_ERROR')
      );

      expect(droppedToastCalls.length).toBeGreaterThan(0);

      const dropData = JSON.parse(droppedToastCalls[0][0].content);
      expect(dropData.data).toBe('unknown');
      expect(dropData.type).toBe('QUEUE_ERROR');
    });
  });

  describe('active timers cleanup (line 71)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should clean up active timers during toast processing', async () => {
      vi.useFakeTimers();
      vi.mocked(saveToFile).mockResolvedValue(undefined);

      const showFn = vi.fn().mockResolvedValue(undefined);

      const queue = createToastQueue(showFn, {
        staggerMs: 50,
        maxSize: 50,
      });

      for (let i = 0; i < 3; i++) {
        queue.add({
          title: `Toast ${i}`,
          message: 'test',
          variant: 'info',
        });
      }

      await vi.runAllTimersAsync();

      expect(showFn).toHaveBeenCalled();
    });
  });

  describe('addMultiple function (line 110)', () => {
    it('should handle adding multiple toasts at once', async () => {
      vi.mocked(saveToFile).mockResolvedValue(undefined);

      const showFn = vi.fn().mockResolvedValue(undefined);

      const maxSize = 5;
      const queue = createToastQueue(showFn, {
        staggerMs: 0,
        maxSize,
      });

      queue.addMultiple([
        {
          title: 'Toast 1',
          message: 'test',
          variant: 'info',
        },
        {
          title: 'Toast 2',
          message: 'test',
          variant: 'info',
        },
        {
          title: 'Toast 3',
          message: 'test',
          variant: 'info',
        },
        {
          title: 'Toast 4',
          message: 'test',
          variant: 'info',
        },
        {
          title: 'Toast 5',
          message: 'test',
          variant: 'info',
        },
        {
          title: 'Toast 6',
          message: 'test',
          variant: 'info',
        },
        {
          title: 'Toast 7',
          message: 'test',
          variant: 'info',
        },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(saveToFile).toHaveBeenCalled();
      expect(showFn).toHaveBeenCalled();
    });
  });
});
