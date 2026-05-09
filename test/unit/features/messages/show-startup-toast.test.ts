import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { homedir } from 'os';

vi.mock('fs/promises', () => ({ readFile: vi.fn() }));

vi.mock('fs', async () => {
  const { createSyncMockFs } = await import('../../helpers/mock-fs');
  const mockFs = createSyncMockFs();
  return { ...mockFs, default: mockFs };
});

vi.mock('.opencode/plugins/config/settings', async () => {
  const { createMockSettings } = await import('../../helpers/mock-settings');
  return createMockSettings();
});

import * as fsPromises from 'fs/promises';
import * as fs from 'fs';

import { showStartupToast } from '.opencode/plugins/features/messages/show-startup-toast';
import * as showActivePluginsModule from '.opencode/plugins/features/messages/show-active-plugins';
import * as pluginIntegration from '.opencode/plugins/features/audit/plugin-integration';
import {
  initGlobalToastQueue,
  resetGlobalToastQueue,
  useGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';
import { mockLogFile } from './test-utils';

function logDir(): string {
  return join(homedir(), '.local', 'share', 'opencode', 'log');
}

async function runShowStartupToast(
  preTimings: number[],
  postTimings: number[] = [300, 1000]
): Promise<ReturnType<typeof vi.fn>> {
  const showFn = vi.fn();
  resetGlobalToastQueue();
  initGlobalToastQueue(showFn, () => {}, 300, 50);
  const promise = showStartupToast({ getLogFile: () => '/fake/log.log' });

  for (const ms of preTimings) {
    await vi.advanceTimersByTimeAsync(ms);
  }

  await promise;

  for (const ms of postTimings) {
    await vi.advanceTimersByTimeAsync(ms);
  }

  return showFn;
}

function assertPluginStatusToastShown(showFn: ReturnType<typeof vi.fn>): void {
  expect(showFn).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Plugin Status' })
  );
}

function setupPatternFileMock(): void {
  vi.mocked(fsPromises.readFile).mockResolvedValue('no toast patterns');
  vi.mocked(fs.existsSync).mockImplementation(((path: string) => {
    if (path === logDir()) return false;
    return false;
  }) as (...args: unknown[]) => boolean);
}

describe('showStartupToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalToastQueue();
    vi.useFakeTimers();
    initGlobalToastQueue(vi.fn(), () => {}, 300, 50);
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readdirSync).mockReturnValue([]);
    vi.mocked(fs.readFileSync).mockReturnValue('');
    vi.mocked(fsPromises.readFile).mockResolvedValue('some no-toast content');
  });

  afterEach(() => {
    vi.useRealTimers();
    resetGlobalToastQueue();
  });

  it('shows loading toast and exits early when no log file', async () => {
    const addSpy = vi.spyOn(useGlobalToastQueue(), 'add');

    await showStartupToast({ getLogFile: () => null });

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Loading plugin status...',
        message: 'Scanning OpenCode plugins',
        variant: 'info',
        duration: 2000,
      })
    );
  });

  it('waits for toast silence then shows active plugins toast', async () => {
    vi.mocked(fsPromises.readFile).mockResolvedValue(
      'no toast pattern in this log'
    );
    mockLogFile(
      vi.mocked(fs),
      logDir(),
      'INFO ... service=plugin name=test loading\n'
    );

    const showFn = await runShowStartupToast(
      [100, 500, 2000, 2500],
      [300, 2000]
    );

    expect(vi.mocked(fsPromises.readFile)).toHaveBeenCalled();
    expect(vi.mocked(fs.existsSync)).toHaveBeenCalled();
    assertPluginStatusToastShown(showFn);
  });

  it('handles timeout (TEN_SECONDS) when silence never resolves', async () => {
    mockLogFile(vi.mocked(fs), logDir(), '');

    vi.mocked(fsPromises.readFile).mockImplementation(() => {
      return new Promise<string>(() => {});
    });

    const showFn = await runShowStartupToast([10000, 2500]);

    assertPluginStatusToastShown(showFn);
  });

  it('handles error from showActivePluginsToast gracefully', async () => {
    vi.mocked(fsPromises.readFile).mockResolvedValue('no toast patterns');
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readdirSync).mockReturnValue([]);
    vi.mocked(fs.readFileSync).mockReturnValue('');

    const showFn = await runShowStartupToast([100, 500, 10000, 2500]);

    assertPluginStatusToastShown(showFn);
  });

  it('skips error recording when getErrorRecorder returns null', async () => {
    setupPatternFileMock();

    const showFn = await runShowStartupToast([100, 10000, 2500]);

    assertPluginStatusToastShown(showFn);
  });

  it('uses default getLogFile when no option provided', async () => {
    const addSpy = vi.spyOn(useGlobalToastQueue(), 'add');
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const promise = showStartupToast();
    await promise;

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Loading plugin status...',
      })
    );
  });

  it('records error when showActivePluginsToast throws', async () => {
    setupPatternFileMock();

    const mockLogError = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(pluginIntegration, 'getErrorRecorder').mockReturnValue({
      logError: mockLogError,
    } as never);

    vi.spyOn(
      showActivePluginsModule,
      'showActivePluginsToast'
    ).mockRejectedValue(new Error('plugins failed'));

    await runShowStartupToast([100, 10000, 2500]);

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'showStartupToast',
      })
    );
  });
});
