import { describe, it, expect, vi } from 'vitest';

const mockReadFileDefault = vi.hoisted(() => vi.fn().mockResolvedValue(''));
vi.mock('fs/promises', () => ({ readFile: mockReadFileDefault }));

import {
  waitForToastSilence,
  countToastsInLog,
} from '.opencode/plugins/features/messages/toast-silence-detector';

describe('waitForToastSilence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves immediately when no new toasts appear', async () => {
    const readFileFn = vi
      .fn()
      .mockResolvedValue('some log content without toasts');
    const { promise, cleanup } = waitForToastSilence(
      '/fake/log.log',
      { pollMs: 100, silenceMs: 200 },
      readFileFn
    );

    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).resolves.toBeUndefined();
    cleanup();
    expect(readFileFn).toHaveBeenCalledWith('/fake/log.log', 'utf-8');
  });

  it('resolves after silence period when toasts stop increasing', async () => {
    const logLines = Array.from(
      { length: 3 },
      (_, i) => `path=/tui/show-toast toast ${i}`
    ).join('\n');

    const readFileFn = vi
      .fn()
      .mockResolvedValueOnce(logLines)
      .mockResolvedValueOnce(logLines);

    const { promise, cleanup } = waitForToastSilence(
      '/fake/log.log',
      { pollMs: 100, silenceMs: 200 },
      readFileFn
    );

    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).resolves.toBeUndefined();
    cleanup();
  });

  it('resets silence timer when new toasts appear', async () => {
    const readFileFn = vi
      .fn()
      .mockResolvedValueOnce('path=/tui/show-toast first')
      .mockResolvedValueOnce(
        'path=/tui/show-toast first\npath=/tui/show-toast second'
      )
      .mockResolvedValueOnce(
        'path=/tui/show-toast first\npath=/tui/show-toast second'
      );

    const { promise, cleanup } = waitForToastSilence(
      '/fake/log.log',
      { pollMs: 100, silenceMs: 200 },
      readFileFn
    );

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);

    await expect(promise).resolves.toBeUndefined();
    cleanup();
  });

  it('resolves on readFile error', async () => {
    const readFileFn = vi.fn().mockRejectedValue(new Error('read error'));

    const { promise, cleanup } = waitForToastSilence(
      '/fake/log.log',
      { pollMs: 100, silenceMs: 200 },
      readFileFn
    );

    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).resolves.toBeUndefined();
    cleanup();
  });

  it('cleanup cancels pending timers', async () => {
    const readFileFn = vi.fn().mockResolvedValue('path=/tui/show-toast first');
    const { promise, cleanup } = waitForToastSilence(
      '/fake/log.log',
      { pollMs: 1000, silenceMs: 2000 },
      readFileFn
    );

    cleanup();

    await vi.advanceTimersByTimeAsync(5000);

    const settled = await Promise.race([
      promise.then(
        () => 'resolved' as const,
        () => 'rejected' as const
      ),
      Promise.resolve('pending' as const),
    ]);

    expect(settled).toBe('pending');
  });
});

describe('countToastsInLog', () => {
  it('returns count of toast patterns', async () => {
    const readFileFn = vi
      .fn()
      .mockResolvedValue(
        [
          'path=/tui/show-toast first',
          'something else',
          'path=/tui/show-toast second',
        ].join('\n')
      );

    const count = await countToastsInLog('/fake/log.log', readFileFn);
    expect(count).toBe(2);
  });

  it('returns 0 when no toast patterns', async () => {
    const readFileFn = vi.fn().mockResolvedValue('no toasts here');

    const count = await countToastsInLog('/fake/log.log', readFileFn);
    expect(count).toBe(0);
  });

  it('returns 0 on read error', async () => {
    const readFileFn = vi.fn().mockRejectedValue(new Error('read error'));

    const count = await countToastsInLog('/fake/log.log', readFileFn);
    expect(count).toBe(0);
  });

  it('uses default readFile when no readFileFn provided', async () => {
    const count = await countToastsInLog('/fake/log.log');
    expect(count).toBe(0);
  });
});
