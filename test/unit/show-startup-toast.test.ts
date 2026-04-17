import { showStartupToast } from '../../.opencode/plugins/features/messages/show-startup-toast';
import { saveToFile } from '../../.opencode/plugins/features/persistence/save-to-file';
import { getLatestLogFile } from '../../.opencode/plugins/features/messages/plugin-status';
import { showActivePluginsToast } from '../../.opencode/plugins/features/messages/show-active-plugins';
import { waitForToastSilence } from '../../.opencode/plugins/features/messages/toast-silence-detector';

const _mockAdd = vi.fn();
const _mockAddMultiple = vi.fn();
const _mockClear = vi.fn();
const _mockFlush = vi.fn().mockResolvedValue(undefined);

vi.mock('../../.opencode/plugins/features/messages/plugin-status', () => ({
  getLatestLogFile: vi.fn(),
}));

vi.mock(
  '../../.opencode/plugins/features/messages/show-active-plugins',
  () => ({
    showActivePluginsToast: vi.fn().mockResolvedValue(undefined),
  })
);

vi.mock(
  '../../.opencode/plugins/features/messages/toast-silence-detector',
  () => ({
    waitForToastSilence: vi.fn(),
  })
);

vi.mock('../../.opencode/plugins/core/constants', () => ({
  TIMER: { OVERWRITE_CHECK_DELAY: 100 },
  TOAST_DURATION: { TWO_SECONDS: 2000, TEN_SECONDS: 10000, FIVE_SECONDS: 5000 },
}));

vi.mock('../../.opencode/plugins/core/toast-queue', () => {
  const mockAdd = vi.fn();
  const mockAddMultiple = vi.fn();
  const mockClear = vi.fn();
  const mockFlush = vi.fn().mockResolvedValue(undefined);
  return {
    useGlobalToastQueue: vi.fn(() => ({
      add: mockAdd,
      addMultiple: mockAddMultiple,
      clear: mockClear,
      flush: mockFlush,
      pending: 0,
    })),
    __mockAdd: mockAdd,
    __mockAddMultiple: mockAddMultiple,
    __mockClear: mockClear,
    __mockFlush: mockFlush,
  };
});

vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: vi.fn().mockResolvedValue(undefined),
}));

import { useGlobalToastQueue } from '../../.opencode/plugins/core/toast-queue';

describe('showStartupToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add initial loading toast', async () => {
    (getLatestLogFile as vi.Mock).mockReturnValue(null);

    await showStartupToast();

    const mockQueue = useGlobalToastQueue();
    expect(mockQueue.add).toHaveBeenCalledWith({
      title: 'Loading plugin status...',
      message: 'Scanning OpenCode plugins',
      variant: 'info',
      duration: 2000,
    });
  });

  it('should call waitForToastSilence when logFile exists', async () => {
    const mockCleanup = vi.fn();
    const mockPromise = Promise.resolve();
    (getLatestLogFile as vi.Mock).mockReturnValue('/test/logfile.log');
    (waitForToastSilence as vi.Mock).mockReturnValue({
      promise: mockPromise,
      cleanup: mockCleanup,
    });

    await showStartupToast();

    expect(waitForToastSilence).toHaveBeenCalledWith('/test/logfile.log');
  });

  it('should not wait for toast silence when logFile is null', async () => {
    (getLatestLogFile as vi.Mock).mockReturnValue(null);
    (waitForToastSilence as vi.Mock).mockReturnValue({
      promise: Promise.resolve(),
      cleanup: vi.fn(),
    });

    await showStartupToast();

    expect(waitForToastSilence).not.toHaveBeenCalled();
    expect(showActivePluginsToast).not.toHaveBeenCalled();
  });

  it('should use custom getLogFile when provided', async () => {
    (getLatestLogFile as vi.Mock).mockReturnValue(null);
    const customGetLogFile = vi.fn().mockReturnValue('/custom/log.log');
    const mockCleanup = vi.fn();
    const mockPromise = Promise.resolve();
    (waitForToastSilence as vi.Mock).mockReturnValue({
      promise: mockPromise,
      cleanup: mockCleanup,
    });

    await showStartupToast({ getLogFile: customGetLogFile });

    expect(customGetLogFile).toHaveBeenCalled();
    expect(getLatestLogFile).not.toHaveBeenCalled();
  });

  it('should handle error when showActivePluginsToast fails', async () => {
    const mockCleanup = vi.fn();
    (getLatestLogFile as vi.Mock).mockReturnValue('/test/logfile.log');
    (waitForToastSilence as vi.Mock).mockReturnValue({
      promise: Promise.resolve(),
      cleanup: mockCleanup,
    });
    (showActivePluginsToast as vi.Mock).mockRejectedValue(
      new Error('Plugin scan failed')
    );

    await showStartupToast();
    await vi.runAllTimersAsync();

    expect(saveToFile).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('PLUGIN_ERROR'),
      })
    );
  });
});
