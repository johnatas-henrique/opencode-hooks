import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';
import { homedir } from 'os';
import { createMockSettings } from '../../../helpers/mock-settings';

vi.mock('fs', async () => {
  const { createSyncMockFs } = await import('../../../helpers/mock-fs');
  const mockFs = createSyncMockFs();
  return { ...mockFs, default: mockFs };
});
vi.mock('.opencode/plugins/config/settings', () => createMockSettings());

import fs from 'fs';
import * as settingsModule from '.opencode/plugins/config/settings';

import { showActivePluginsToast } from '.opencode/plugins/features/messages/show-active-plugins';
import type { ToastQueue } from '.opencode/plugins/types/toast';
import { mockLogFile } from '../../../helpers/test-utils';

function logDir(): string {
  const home = homedir();
  return join(home, '.local', 'share', 'opencode', 'log');
}

const activeLogLine =
  'INFO 2026-01-01T00:00:00.000Z +0ms service=plugin name=test-plugin loading';
const failedLogLine =
  'ERROR 2026-01-01T00:00:00.000Z +0ms service=plugin name=broken-plugin error=timeout failed to load';
const incompatibleLogLine =
  'WARN 2026-01-01T00:00:00.000Z +0ms service=plugin name=old-plugin incompatible version';

function makeMockQueue(): ToastQueue {
  return {
    add: vi.fn(),
    addMultiple: vi.fn(),
    clear: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    pending: 0,
  };
}

describe('showActivePluginsToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsModule).userConfig.showPluginStatus = true;
    vi.mocked(settingsModule).userConfig.pluginStatusDisplayMode = 'user-only';
  });

  it('returns early when showPluginStatus is false', async () => {
    vi.mocked(settingsModule).userConfig.showPluginStatus = false;
    const queue = makeMockQueue();

    await showActivePluginsToast(queue);

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('calls getPluginStatus and formatPluginStatus and adds toast', async () => {
    mockLogFile(vi.mocked(fs), logDir(), `${activeLogLine}\n`);

    const queue = makeMockQueue();
    await showActivePluginsToast(queue);

    expect(queue.add).toHaveBeenCalledOnce();
    expect(queue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plugin Status',
        variant: 'info',
      })
    );
    const callArg = vi.mocked(queue.add).mock.calls[0][0];
    expect(callArg.message).toContain('Plugins:');
  });

  it('uses warning variant when there are issues', async () => {
    mockLogFile(vi.mocked(fs), logDir(), `${failedLogLine}\n`);

    const queue = makeMockQueue();
    await showActivePluginsToast(queue);

    expect(queue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plugin Status',
        variant: 'warning',
      })
    );
  });

  it('accepts custom duration option', async () => {
    mockLogFile(vi.mocked(fs), logDir(), '');

    const queue = makeMockQueue();
    await showActivePluginsToast(queue, { duration: 3000 });

    expect(queue.add).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 3000 })
    );
  });

  it('uses warning variant for incompatible status', async () => {
    mockLogFile(vi.mocked(fs), logDir(), `${incompatibleLogLine}\n`);

    const queue = makeMockQueue();
    await showActivePluginsToast(queue);

    expect(queue.add).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'warning' })
    );
  });
});
