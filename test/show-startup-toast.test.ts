import { showStartupToast } from '../.opencode/plugins/helpers/show-startup-toast';

jest.mock('../.opencode/plugins/helpers/plugin-status', () => ({
  getLatestLogFile: jest.fn(),
}));

jest.mock('../.opencode/plugins/helpers/show-active-plugins', () => ({
  showActivePluginsToast: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../.opencode/plugins/helpers/toast-silence-detector', () => ({
  waitForToastSilence: jest.fn(),
}));

jest.mock('../.opencode/plugins/helpers/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../.opencode/plugins/helpers/constants', () => ({
  TIMER: { OVERWRITE_CHECK_DELAY: 100 },
  TOAST_DURATION: { TWO_SECONDS: 2000, TEN_SECONDS: 10000, FIVE_SECONDS: 5000 },
}));

jest.mock('../.opencode/plugins/helpers/toast-queue', () => {
  const mockQueue = {
    add: jest.fn(),
    addMultiple: jest.fn(),
    clear: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    pending: 0,
  };
  return {
    useGlobalToastQueue: jest.fn(() => mockQueue),
  };
});

const mockGetLatestLogFile =
  require('../.opencode/plugins/helpers/plugin-status').getLatestLogFile;
const mockWaitForToastSilence =
  require('../.opencode/plugins/helpers/toast-silence-detector').waitForToastSilence;
const mockShowActivePluginsToast =
  require('../.opencode/plugins/helpers/show-active-plugins').showActivePluginsToast;
const mockSaveToFile =
  require('../.opencode/plugins/helpers/save-to-file').saveToFile;

describe('showStartupToast', () => {
  let mockQueue: {
    add: jest.Mock;
    addMultiple: jest.Mock;
    clear: jest.Mock;
    flush: jest.Mock;
    pending: number;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueue = {
      add: jest.fn(),
      addMultiple: jest.fn(),
      clear: jest.fn(),
      flush: jest.fn().mockResolvedValue(undefined),
      pending: 0,
    };

    const useGlobalToastQueue =
      require('../.opencode/plugins/helpers/toast-queue').useGlobalToastQueue;
    useGlobalToastQueue.mockReturnValue(mockQueue);
  });

  it('should add initial loading toast', async () => {
    mockGetLatestLogFile.mockReturnValue(null);

    await showStartupToast();

    expect(mockQueue.add).toHaveBeenCalledWith({
      title: 'Loading plugin status...',
      message: 'Scanning OpenCode plugins',
      variant: 'info',
      duration: 2000,
    });
  });

  it('should call waitForToastSilence when logFile exists', async () => {
    const mockCleanup = jest.fn();
    const mockPromise = Promise.resolve();
    mockGetLatestLogFile.mockReturnValue('/test/logfile.log');
    mockWaitForToastSilence.mockReturnValue({
      promise: mockPromise,
      cleanup: mockCleanup,
    });

    await showStartupToast();

    expect(mockWaitForToastSilence).toHaveBeenCalledWith('/test/logfile.log');
  });

  it('should show active plugins toast after silence detected', async () => {
    jest.useFakeTimers();
    const mockCleanup = jest.fn();
    const mockPromise = Promise.resolve();
    mockGetLatestLogFile.mockReturnValue('/test/logfile.log');
    mockWaitForToastSilence.mockReturnValue({
      promise: mockPromise,
      cleanup: mockCleanup,
    });

    await showStartupToast();
    await jest.runAllTimersAsync();
    await Promise.resolve();

    expect(mockShowActivePluginsToast).toHaveBeenCalledWith(mockQueue, {
      duration: 5000,
    });
    jest.useRealTimers();
  });

  it('should save error to file when showActivePluginsToast throws', async () => {
    jest.useFakeTimers();
    const mockCleanup = jest.fn();
    const mockPromise = Promise.resolve();
    mockGetLatestLogFile.mockReturnValue('/test/logfile.log');
    mockWaitForToastSilence.mockReturnValue({
      promise: mockPromise,
      cleanup: mockCleanup,
    });
    mockShowActivePluginsToast.mockRejectedValueOnce(
      new Error('Plugin read error')
    );

    await showStartupToast();
    await jest.runAllTimersAsync();
    await Promise.resolve();

    expect(mockSaveToFile).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Startup toast error'),
      })
    );
    jest.useRealTimers();
  });

  it('should use custom getLogFile when provided', async () => {
    const customGetLogFile = jest.fn().mockReturnValue('/custom/log.log');
    const mockCleanup = jest.fn();
    const mockPromise = Promise.resolve();
    mockWaitForToastSilence.mockReturnValue({
      promise: mockPromise,
      cleanup: mockCleanup,
    });

    await showStartupToast({ getLogFile: customGetLogFile });

    expect(customGetLogFile).toHaveBeenCalled();
    expect(mockGetLatestLogFile).not.toHaveBeenCalled();
  });
});
