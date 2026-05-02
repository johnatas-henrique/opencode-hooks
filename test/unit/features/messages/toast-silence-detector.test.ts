import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  waitForToastSilence,
  countToastsInLog,
} from '.opencode/plugins/features/messages/toast-silence-detector';

const createMockReadFile = (content: string | Error) =>
  vi.fn().mockImplementation(async () => {
    if (content instanceof Error) throw content;
    return content;
  });

const createSequenceReadFile = (contents: string[]) => {
  let index = 0;
  return vi.fn().mockImplementation(async () => {
    const result = contents[index] ?? contents[contents.length - 1];
    index++;
    return result;
  });
};

describe('toast-silence-detector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('waitForToastSilence', () => {
    it('should resolve immediately when no toasts found', async () => {
      const mockReadFile = createMockReadFile('no toasts here');
      const { promise, cleanup } = waitForToastSilence(
        '/fake/log.log',
        { pollMs: 100, silenceMs: 500 },
        mockReadFile
      );

      await Promise.resolve();
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      await promise;
      cleanup();
    });

    it('should schedule silenceTimer when toast count increases', async () => {
      const mockReadFile = createSequenceReadFile([
        'path=/tui/show-toast',
        'path=/tui/show-toast path=/tui/show-toast',
        'path=/tui/show-toast path=/tui/show-toast',
      ]);

      const { promise, cleanup } = waitForToastSilence(
        '/fake/log.log',
        { silenceMs: 500, pollMs: 100 },
        mockReadFile
      );

      await Promise.resolve();
      expect(mockReadFile).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      await Promise.resolve();
      expect(mockReadFile).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(500);
      await Promise.resolve();
      await promise;

      cleanup();
    });

    it('should handle readFile error in catch block', async () => {
      const mockReadFile = vi
        .fn()
        .mockRejectedValue(new Error('File read error'));

      const { promise, cleanup } = waitForToastSilence(
        '/fake/log.log',
        { pollMs: 100 },
        mockReadFile
      );

      await Promise.resolve();
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();
      await promise;

      cleanup();
    });

    it('should clear timers in catch block', async () => {
      const mockReadFile = createMockReadFile(new Error('Read error'));

      const { promise, cleanup } = waitForToastSilence(
        '/fake/log.log',
        { pollMs: 100 },
        mockReadFile
      );

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
      const mockReadFile = createMockReadFile(
        'path=/tui/show-toast\npath=/tui/show-toast\npath=/tui/show-toast'
      );

      const count = await countToastsInLog('/fake/log.log', mockReadFile);
      expect(count).toBe(3);
    });

    it('should return 0 when no toasts', async () => {
      const mockReadFile = createMockReadFile('no toasts here');

      const count = await countToastsInLog('/fake/log.log', mockReadFile);
      expect(count).toBe(0);
    });

    it('should return 0 on file error', async () => {
      const mockReadFile = createMockReadFile(new Error('Permission denied'));

      const count = await countToastsInLog('/fake/log.log', mockReadFile);
      expect(count).toBe(0);
    });
  });
});
