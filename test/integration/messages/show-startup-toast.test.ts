import { showStartupToast } from '.opencode/plugins/features/messages/show-startup-toast';

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

const runStartupToastErrorTest = async (errorValue: unknown) => {
  const mockCleanup = vi.fn();
  mockGetLatestLogFile.mockReturnValue('/test/logfile.log');
  mockWaitForToastSilence.mockReturnValue({
    promise: Promise.resolve(),
    cleanup: mockCleanup,
  });
  mockShowActivePluginsToast.mockRejectedValue(errorValue);
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
};

vi.mock('.opencode/plugins/features/messages/plugin-status', () => ({
  getLatestLogFile: mockGetLatestLogFile,
}));

vi.mock('.opencode/plugins/features/messages/show-active-plugins', () => ({
  showActivePluginsToast: mockShowActivePluginsToast,
}));

vi.mock('.opencode/plugins/features/messages/toast-silence-detector', () => ({
  waitForToastSilence: mockWaitForToastSilence,
}));

import {
  TOAST_DEFAULTS,
  SCRIPTS_DEFAULTS,
  CORE_DEFAULTS,
  AUDIT_DEFAULTS,
  DISABLED_CONFIG_DEFAULTS,
} from '../../helpers/mock-defaults';

vi.mock('.opencode/plugins/core/constants', () => ({
  DEFAULTS: {
    toast: TOAST_DEFAULTS,
    scripts: SCRIPTS_DEFAULTS,
    core: CORE_DEFAULTS,
    audit: AUDIT_DEFAULTS,
    config: {
      disabled: DISABLED_CONFIG_DEFAULTS,
    },
  },
}));

vi.mock('.opencode/plugins/core/toast-queue', () => ({
  useGlobalToastQueue: vi.fn(() => ({
    add: mockAdd,
    addMultiple: mockAddMultiple,
    clear: mockClear,
    flush: mockFlush,
    pending: 0,
  })),
}));

vi.mock('.opencode/plugins/features/audit/plugin-integration', () => ({
  getErrorRecorder: mockGetErrorRecorder,
  getLastKnownSessionId: vi.fn().mockReturnValue('ses_test123'),
}));

describe('showStartupToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('should use errorRecorder.logError when errorRecorder is present', async () => {
    await runStartupToastErrorTest(new Error('Plugin scan failed'));
  });

  it('should convert non-Error thrown to Error in errorRecorder.logError', async () => {
    await runStartupToastErrorTest('string error');
    // Verifica que o erro foi convertido
    const loggedError = mockLogError.mock.calls[0][0].error;
    expect(loggedError.message).toBe('string error');
  });
});
