import { showStartupToast } from '../../.opencode/plugins/features/messages/show-startup-toast';

// Use vi.hoisted for isolated mocks that persist correctly
const {
  mockAdd,
  mockAddMultiple,
  mockClear,
  mockFlush,
  mockGetLatestLogFile,
  mockWaitForToastSilence,
  mockShowActivePluginsToast,
  mockLogError,
  mockGetErrorRecorder,
} = vi.hoisted(() => ({
  mockAdd: vi.fn(),
  mockAddMultiple: vi.fn(),
  mockClear: vi.fn(),
  mockFlush: vi.fn().mockResolvedValue(undefined),
  mockGetLatestLogFile: vi.fn(),
  mockWaitForToastSilence: vi.fn(),
  mockShowActivePluginsToast: vi.fn().mockResolvedValue(undefined),
  mockLogError: vi.fn().mockResolvedValue(undefined),
  mockGetErrorRecorder: vi.fn().mockReturnValue(null),
}));

vi.mock('../../.opencode/plugins/features/messages/plugin-status', () => ({
  getLatestLogFile: mockGetLatestLogFile,
}));

vi.mock(
  '../../.opencode/plugins/features/messages/show-active-plugins',
  () => ({
    showActivePluginsToast: mockShowActivePluginsToast,
  })
);

vi.mock(
  '../../.opencode/plugins/features/messages/toast-silence-detector',
  () => ({
    waitForToastSilence: mockWaitForToastSilence,
  })
);

vi.mock('../../.opencode/plugins/core/constants', () => ({
  TIMER: { OVERWRITE_CHECK_DELAY: 100 },
  TOAST_DURATION: { TWO_SECONDS: 2000, TEN_SECONDS: 10000, FIVE_SECONDS: 5000 },
}));

vi.mock('../../.opencode/plugins/core/toast-queue', () => ({
  useGlobalToastQueue: vi.fn(() => ({
    add: mockAdd,
    addMultiple: mockAddMultiple,
    clear: mockClear,
    flush: mockFlush,
    pending: 0,
  })),
}));

vi.mock('../../.opencode/plugins/features/audit/plugin-integration', () => ({
  getErrorRecorder: mockGetErrorRecorder,
}));

describe('showStartupToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not wait for toast silence when logFile is null', async () => {
    mockGetLatestLogFile.mockReturnValue(null);
    mockWaitForToastSilence.mockReturnValue({
      promise: Promise.resolve(),
      cleanup: vi.fn(),
    });

    await showStartupToast();

    expect(mockShowActivePluginsToast).not.toHaveBeenCalled();
  });

  it('should handle error when showActivePluginsToast fails', async () => {
    const mockCleanup = vi.fn();
    mockGetLatestLogFile.mockReturnValue('/test/logfile.log');
    mockWaitForToastSilence.mockReturnValue({
      promise: Promise.resolve(),
      cleanup: mockCleanup,
    });
    mockShowActivePluginsToast.mockRejectedValue(
      new Error('Plugin scan failed')
    );
    mockGetErrorRecorder.mockReturnValue(null);

    await showStartupToast();
    await vi.runAllTimersAsync();

    // No errorRecorder present, so no error logging should happen
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it('should use errorRecorder.logError when errorRecorder is present (line 48)', async () => {
    const mockCleanup = vi.fn();
    mockGetLatestLogFile.mockReturnValue('/test/logfile.log');
    mockWaitForToastSilence.mockReturnValue({
      promise: Promise.resolve(),
      cleanup: mockCleanup,
    });
    mockShowActivePluginsToast.mockRejectedValue(
      new Error('Plugin scan failed')
    );
    mockGetErrorRecorder.mockReturnValue({
      logError: mockLogError,
    });

    await showStartupToast();
    await vi.runAllTimersAsync();

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        context: 'showStartupToast',
      })
    );
  });

  it('should convert non-Error thrown to Error in errorRecorder.logError', async () => {
    const mockCleanup = vi.fn();
    mockGetLatestLogFile.mockReturnValue('/test/logfile.log');
    mockWaitForToastSilence.mockReturnValue({
      promise: Promise.resolve(),
      cleanup: mockCleanup,
    });
    mockShowActivePluginsToast.mockRejectedValue('string error');
    mockGetErrorRecorder.mockReturnValue({
      logError: mockLogError,
    });

    await showStartupToast();
    await vi.runAllTimersAsync();

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        context: 'showStartupToast',
      })
    );
    const loggedError = mockLogError.mock.calls[0][0].error;
    expect(loggedError.message).toBe('string error');
  });
});
