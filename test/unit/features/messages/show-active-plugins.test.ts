import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';
import { homedir } from 'os';

const mockFs = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const mockSettings = vi.hoisted(() => ({
  userConfig: {
    enabled: true,
    logDisabledEvents: false,
    showPluginStatus: true,
    pluginStatusDisplayMode: 'user-only' as const,
    loadClaudeHookSettings: { enabled: false },
    scriptToasts: {
      showOutput: true,
      showError: true,
      outputVariant: 'info' as const,
      errorVariant: 'error' as const,
      outputDuration: 5000,
      errorDuration: 15000,
      outputTitle: 'Script Output',
      errorTitle: 'Script Error',
    },
    default: {
      debug: false,
      toast: false,
      runScripts: false,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: false,
    },
    audit: {
      enabled: true,
      level: 'debug' as const,
      basePath: '/tmp/test-audit',
      maxSizeMB: 1,
      maxAgeDays: 30,
      logTruncationKB: 10,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [
        'patch',
        'diff',
        'content',
        'snapshot',
        'output',
        'result',
        'text',
      ],
    },
    events: {},
    tools: {
      'tool.execute.after': {},
      'tool.execute.after.subagent': {},
      'tool.execute.before': {},
    },
  },
}));

vi.mock('fs', () => mockFs);
vi.mock('.opencode/plugins/config/settings', () => mockSettings);

import { showActivePluginsToast } from '.opencode/plugins/features/messages/show-active-plugins';
import type { ToastQueue } from '.opencode/plugins/types/toast';
import { mockLogFile } from './test-utils';

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
    mockSettings.userConfig.showPluginStatus = true;
    mockSettings.userConfig.pluginStatusDisplayMode = 'user-only';
  });

  it('returns early when showPluginStatus is false', async () => {
    mockSettings.userConfig.showPluginStatus = false;
    const queue = makeMockQueue();

    await showActivePluginsToast(queue);

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('calls getPluginStatus and formatPluginStatus and adds toast', async () => {
    mockLogFile(mockFs, logDir(), `${activeLogLine}\n`);

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
    mockLogFile(mockFs, logDir(), `${failedLogLine}\n`);

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
    mockLogFile(mockFs, logDir(), '');

    const queue = makeMockQueue();
    await showActivePluginsToast(queue, { duration: 3000 });

    expect(queue.add).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 3000 })
    );
  });

  it('uses warning variant for incompatible status', async () => {
    mockLogFile(mockFs, logDir(), `${incompatibleLogLine}\n`);

    const queue = makeMockQueue();
    await showActivePluginsToast(queue);

    expect(queue.add).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'warning' })
    );
  });
});
