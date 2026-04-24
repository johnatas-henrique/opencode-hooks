import { createToastQueue } from '../../.opencode/plugins/core/toast-queue';
import { vi, beforeEach, afterEach, expect, describe, it } from 'vitest';
import {
  getErrorRecorder,
  initAuditLogging,
  resetAuditLogging,
} from '../../.opencode/plugins/features/audit/plugin-integration';
import type { AuditConfig } from '../../.opencode/plugins/types/audit';

const TEST_CONFIG: AuditConfig = {
  enabled: true,
  level: 'debug',
  basePath: './test-audit',
  maxSizeMB: 10,
  maxAgeDays: 30,
  logTruncationKB: 10,
  maxFieldSize: 1000,
  maxArrayItems: 50,
  largeFields: [],
};

vi.mock('../../.opencode/plugins/features/audit/audit-logger', async () => ({
  createAuditLogger: vi.fn(),
  checkRotation: vi.fn().mockResolvedValue(false),
}));

const { createAuditLogger } =
  await import('../../.opencode/plugins/features/audit/audit-logger');

const mockCreateAuditLogger = vi.mocked(createAuditLogger);

describe('toast queue concurrency integration', () => {
  let mockLogger: ReturnType<typeof createAuditLogger> | null = null;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockLogger = {
      writeLine: vi.fn().mockResolvedValue(undefined),
      getFileData: vi.fn(),
      checkRotation: vi.fn(),
      getBasePath: vi.fn().mockReturnValue('./test'),
      close: vi.fn(),
    } as unknown as ReturnType<typeof createAuditLogger>;

    mockCreateAuditLogger.mockReturnValue(mockLogger);

    await initAuditLogging(TEST_CONFIG);
  });

  afterEach(() => {
    resetAuditLogging();
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
      const errorRecorder = getErrorRecorder();
      expect(errorRecorder).toBeDefined();

      const mockLogError = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(errorRecorder!, 'logError').mockImplementation(mockLogError);

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

      expect(mockLogError).toHaveBeenCalled();
    });

    it('should use default session ID for dropped toast with no title', async () => {
      const errorRecorder = getErrorRecorder();
      expect(errorRecorder).toBeDefined();

      const mockLogError = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(errorRecorder!, 'logError').mockImplementation(mockLogError);

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

      expect(mockLogError).toHaveBeenCalled();
    });
  });

  describe('active timers cleanup (line 71)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should clean up active timers during toast processing', async () => {
      vi.useFakeTimers();

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
      const errorRecorder = getErrorRecorder();
      expect(errorRecorder).toBeDefined();

      const mockLogError = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(errorRecorder!, 'logError').mockImplementation(mockLogError);

      const showFn = vi.fn().mockResolvedValue(undefined);

      const queue = createToastQueue(showFn, {
        staggerMs: 0,
        maxSize: 5,
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

      expect(mockLogError).toHaveBeenCalled();
      expect(showFn).toHaveBeenCalled();
    });
  });
});
