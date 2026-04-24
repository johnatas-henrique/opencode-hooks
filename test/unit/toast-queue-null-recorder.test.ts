import { vi } from 'vitest';
import {
  createToastQueue,
  resetGlobalToastQueue,
} from '../../.opencode/plugins/core/toast-queue';

vi.mock('../../.opencode/plugins/features/audit/plugin-integration', () => ({
  getErrorRecorder: vi.fn(() => null),
  initAuditLogging: vi.fn(),
  getScriptRecorder: vi.fn(),
  resetAuditLogging: vi.fn(),
}));

describe('toast-queue with null errorRecorder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGlobalToastQueue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('logDroppedToast when getErrorRecorder returns null', () => {
    it('should not throw when toast is dropped and getErrorRecorder returns null (line 85-89 via addMultiple)', () => {
      const showFn = vi.fn();
      const queue = createToastQueue(showFn, {
        maxSize: 1,
        staggerMs: 999999,
      });

      queue.addMultiple([
        { title: '1', message: 'msg', variant: 'info' as const },
        { title: '2', message: 'msg', variant: 'info' as const },
      ]);

      // processQueue runs synchronously until first await, so queue is already empty
      expect(queue.pending).toBe(0);
    });
  });
});
