import {
  waitForToastSilence,
  countToastsInLog,
} from '../../.opencode/plugins/features/messages/toast-silence-detector';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

import { readFile } from 'fs/promises';

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe('toast-silence-detector', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('waitForToastSilence', () => {
    it('should resolve when no toasts in log', async () => {
      mockReadFile.mockResolvedValue('no toasts here');

      const { promise, cleanup } = waitForToastSilence('/fake/log.log');

      jest.advanceTimersByTime(200);
      await promise;

      cleanup();
    });

    it('should resolve after silence period following toast activity', async () => {
      let callCount = 0;
      mockReadFile.mockImplementation(async () => {
        callCount++;
        if (callCount <= 3) return 'path=/tui/show-toast path=/tui/show-toast';
        return 'path=/tui/show-toast path=/tui/show-toast';
      });

      const { promise, cleanup } = waitForToastSilence('/fake/log.log', {
        silenceMs: 1500,
        pollMs: 200,
      });

      jest.advanceTimersByTime(200);
      jest.advanceTimersByTime(1500);
      jest.advanceTimersByTime(200);

      await promise;

      cleanup();
    });

    it('should reset timer when new toast appears', async () => {
      let callCount = 0;
      mockReadFile.mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) return 'path=/tui/show-toast';
        if (callCount <= 5) return 'path=/tui/show-toast path=/tui/show-toast';
        return 'path=/tui/show-toast path=/tui/show-toast';
      });

      const { promise, cleanup } = waitForToastSilence('/fake/log.log', {
        silenceMs: 1500,
        pollMs: 200,
      });

      jest.advanceTimersByTime(200);
      jest.advanceTimersByTime(200);
      jest.advanceTimersByTime(200);
      jest.advanceTimersByTime(1500);
      jest.advanceTimersByTime(200);

      await promise;

      cleanup();
    });

    it('should resolve on log file error', async () => {
      mockReadFile.mockImplementation(async () => {
        throw new Error('File not found');
      });

      const { promise, cleanup } = waitForToastSilence('/fake/log.log');

      jest.advanceTimersByTime(200);
      await promise;

      cleanup();
    });

    it('should stop polling after cleanup', async () => {
      mockReadFile.mockResolvedValue('path=/tui/show-toast');

      const { cleanup } = waitForToastSilence('/fake/log.log', {
        silenceMs: 10000,
      });

      cleanup();

      jest.advanceTimersByTime(200);
      jest.advanceTimersByTime(200);
      jest.advanceTimersByTime(200);

      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it('should not schedule poll when already resolved', async () => {
      mockReadFile.mockResolvedValue('path=/tui/show-toast');

      const { promise, cleanup } = waitForToastSilence('/fake/log.log');

      await jest.runAllTimersAsync();
      await promise;

      const callCountBefore = mockReadFile.mock.calls.length;
      cleanup();
      const callCountAfter = mockReadFile.mock.calls.length;

      expect(callCountAfter).toBe(callCountBefore);
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
