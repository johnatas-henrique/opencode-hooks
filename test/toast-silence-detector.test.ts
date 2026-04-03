import {
  waitForToastSilence,
  countToastsInLog,
} from '../.opencode/plugins/helpers/toast-silence-detector';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

import { readFileSync } from 'fs';

const mockReadFileSync = readFileSync as jest.MockedFunction<
  typeof readFileSync
>;

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
      mockReadFileSync.mockReturnValue('no toasts here');

      const { promise, cleanup } = waitForToastSilence('/fake/log.log');

      jest.advanceTimersByTime(200);
      await promise;

      cleanup();
    });

    it('should resolve after silence period following toast activity', async () => {
      let callCount = 0;
      mockReadFileSync.mockImplementation(() => {
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
      mockReadFileSync.mockImplementation(() => {
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
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const { promise, cleanup } = waitForToastSilence('/fake/log.log');

      jest.advanceTimersByTime(200);
      await promise;

      cleanup();
    });

    it('should stop polling after cleanup', async () => {
      mockReadFileSync.mockReturnValue('path=/tui/show-toast');

      const { cleanup } = waitForToastSilence('/fake/log.log', {
        silenceMs: 10000,
      });

      cleanup();

      jest.advanceTimersByTime(200);
      jest.advanceTimersByTime(200);
      jest.advanceTimersByTime(200);

      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('countToastsInLog', () => {
    it('should return correct count', () => {
      mockReadFileSync.mockReturnValue(
        'path=/tui/show-toast\npath=/tui/show-toast\npath=/tui/show-toast'
      );

      const count = countToastsInLog('/fake/log.log');
      expect(count).toBe(3);
    });

    it('should return 0 when no toasts', () => {
      mockReadFileSync.mockReturnValue('no toasts here');

      const count = countToastsInLog('/fake/log.log');
      expect(count).toBe(0);
    });

    it('should return 0 on file error', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const count = countToastsInLog('/fake/log.log');
      expect(count).toBe(0);
    });
  });
});
