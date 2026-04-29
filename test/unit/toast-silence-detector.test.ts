import type { MockedFunction } from 'vitest';
import {
  waitForToastSilence,
  countToastsInLog,
} from '../../.opencode/plugins/features/messages/toast-silence-detector';

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

import { readFile } from 'fs/promises';

const mockReadFile = readFile as MockedFunction<typeof readFile>;

describe('toast-silence-detector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('waitForToastSilence', () => {
    it('should resolve when no toasts in log', async () => {
      mockReadFile.mockResolvedValue('no toasts here');

      const { promise, cleanup } = waitForToastSilence('/fake/log.log');

      vi.advanceTimersByTime(200);
      await promise;

      cleanup();
    });

    it('should schedule silenceTimer when toast count increases', async () => {
      let callCount = 0;
      mockReadFile.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return 'path=/tui/show-toast';
        if (callCount === 2) return 'path=/tui/show-toast path=/tui/show-toast';
        return 'path=/tui/show-toast path=/tui/show-toast';
      });

      const { promise, cleanup } = waitForToastSilence('/fake/log.log', {
        silenceMs: 500,
        pollMs: 100,
      });

      await Promise.resolve();
      expect(callCount).toBe(1);

      vi.advanceTimersByTime(100);
      await Promise.resolve();
      expect(callCount).toBe(2);

      vi.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await promise;

      cleanup();
    });

    it('should handle readFile error in catch block', async () => {
      let errorCount = 0;
      mockReadFile.mockImplementation(async () => {
        errorCount++;
        if (errorCount === 1) return 'path=/tui/show-toast';
        throw new Error('File read error');
      });

      const { promise, cleanup } = waitForToastSilence('/fake/log.log', {
        pollMs: 100,
      });

      await Promise.resolve();
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();
      await promise;

      cleanup();
    });

    it('should clear timers in catch block', async () => {
      mockReadFile.mockRejectedValue(new Error('Read error'));

      const { promise, cleanup } = waitForToastSilence('/fake/log.log', {
        pollMs: 100,
      });

      await Promise.resolve();
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();
      await promise;

      cleanup();
    });
  });

  describe('countToastsInLog', () => {
    it('should return correct count', async () => {
      mockReadFile.mockResolvedValue(
        'path=/tui/show-toast\npath=/tui/show-toast\npath=/tui/show-toast'
      );

      const count = await countToastsInLog('/fake/log.log');
      expect(count).toBe(3);
    });

    it('should return 0 when no toasts', async () => {
      mockReadFile.mockResolvedValue('no toasts here');

      const count = await countToastsInLog('/fake/log.log');
      expect(count).toBe(0);
    });

    it('should return 0 on file error', async () => {
      mockReadFile.mockImplementation(async () => {
        throw new Error('Permission denied');
      });

      const count = await countToastsInLog('/fake/log.log');
      expect(count).toBe(0);
    });
  });
});
