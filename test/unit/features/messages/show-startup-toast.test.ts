import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { homedir } from 'os';

const mockReadFile = vi.hoisted(() => vi.fn());

const mockFs = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
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

import { showStartupToast } from '.opencode/plugins/features/messages/show-startup-toast';
import * as showActivePluginsModule from '.opencode/plugins/features/messages/show-active-plugins';
import * as pluginIntegration from '.opencode/plugins/features/audit/plugin-integration';
import {
  initGlobalToastQueue,
  resetGlobalToastQueue,
  useGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';

function logDir(): string {
  return join(homedir(), '.local', 'share', 'opencode', 'log');
}

describe('showStartupToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalToastQueue();
    vi.useFakeTimers();
    initGlobalToastQueue(vi.fn(), () => {}, 300, 50);
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readdirSync.mockReturnValue([]);
    mockFs.readFileSync.mockReturnValue('');
    mockReadFile.mockResolvedValue('some no-toast content');
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
    mockReadFile.mockResolvedValue('no toast pattern in this log');
    mockFs.existsSync.mockImplementation((path: string) => {
      if (path === logDir()) return true;
      if (path === join(logDir(), 'dev.log')) return true;
      return false;
    });
    mockFs.readdirSync.mockImplementation((path: string) => {
      if (path === logDir()) return ['dev.log'];
      return [];
    });
    mockFs.readFileSync.mockImplementation((path: string) => {
      if (path === join(logDir(), 'dev.log'))
        return 'INFO ... service=plugin name=test loading\n';
      return '';
    });

    const showFn = vi.fn();
    resetGlobalToastQueue();
    initGlobalToastQueue(showFn, () => {}, 300, 50);

    const promise = showStartupToast({ getLogFile: () => '/fake/log.log' });

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(2500);

    await promise;

    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(2000);

    expect(mockReadFile).toHaveBeenCalled();
    expect(mockFs.existsSync).toHaveBeenCalled();
    expect(showFn).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Plugin Status' })
    );
  });

  it('handles timeout (TEN_SECONDS) when silence never resolves', async () => {
    mockFs.existsSync.mockImplementation((path: string) => {
      if (path === logDir()) return true;
      if (path === join(logDir(), 'dev.log')) return true;
      return false;
    });
    mockFs.readdirSync.mockImplementation((path: string) => {
      if (path === logDir()) return ['dev.log'];
      return [];
    });
    mockFs.readFileSync.mockImplementation((path: string) => {
      if (path === join(logDir(), 'dev.log')) return '';
      return '';
    });

    mockReadFile.mockImplementation(() => {
      return new Promise<string>(() => {});
    });

    const showFn = vi.fn();
    resetGlobalToastQueue();
    initGlobalToastQueue(showFn, () => {}, 300, 50);

    const promise = showStartupToast({ getLogFile: () => '/fake/log.log' });

    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(2500);

    await promise;

    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(1000);

    expect(showFn).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Plugin Status' })
    );
  });

  it('handles error from showActivePluginsToast gracefully', async () => {
    mockReadFile.mockResolvedValue('no toast patterns');
    mockFs.existsSync.mockImplementation((path: string) => {
      if (path === logDir()) return false;
      return false;
    });
    mockFs.readdirSync.mockReturnValue([]);
    mockFs.readFileSync.mockReturnValue('');

    const showFn = vi.fn();
    resetGlobalToastQueue();
    initGlobalToastQueue(showFn, () => {}, 300, 50);

    const promise = showStartupToast({ getLogFile: () => '/fake/log.log' });

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(2500);

    await promise;

    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(1000);

    expect(showFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plugin Status',
      })
    );
  });

  it('skips error recording when getErrorRecorder returns null', async () => {
    mockReadFile.mockResolvedValue('no toast patterns');
    mockFs.existsSync.mockImplementation((path: string) => {
      if (path === logDir()) return false;
      return false;
    });

    const showFn = vi.fn();
    resetGlobalToastQueue();
    initGlobalToastQueue(showFn, () => {}, 300, 50);

    const promise = showStartupToast({ getLogFile: () => '/fake/log.log' });

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(2500);

    await promise;

    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(1000);

    expect(showFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plugin Status',
      })
    );
  });

  it('uses default getLogFile when no option provided', async () => {
    const addSpy = vi.spyOn(useGlobalToastQueue(), 'add');
    mockFs.existsSync.mockReturnValue(false);

    const promise = showStartupToast();
    await promise;

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Loading plugin status...',
      })
    );
  });

  it('records error when showActivePluginsToast throws', async () => {
    mockReadFile.mockResolvedValue('no toast patterns');
    mockFs.existsSync.mockImplementation((path: string) => {
      if (path === logDir()) return false;
      return false;
    });

    const mockLogError = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(pluginIntegration, 'getErrorRecorder').mockReturnValue({
      logError: mockLogError,
    } as never);

    vi.spyOn(
      showActivePluginsModule,
      'showActivePluginsToast'
    ).mockRejectedValue(new Error('plugins failed'));

    const showFn = vi.fn();
    resetGlobalToastQueue();
    initGlobalToastQueue(showFn, () => {}, 300, 50);

    const promise = showStartupToast({ getLogFile: () => '/fake/log.log' });

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(10000);
    await vi.advanceTimersByTimeAsync(2500);

    await promise;

    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(1000);

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'showStartupToast',
      })
    );
  });
});
