import { handleDebugLog } from '../.opencode/plugins/helpers/debug';

jest.mock('../.opencode/plugins/helpers/toast-queue', () => {
  const mockQueue = {
    add: jest.fn(),
  };
  return {
    useGlobalToastQueue: jest.fn(() => mockQueue),
  };
});

jest.mock('../.opencode/plugins/helpers/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../.opencode/plugins/helpers/constants', () => ({
  TOAST_DURATION: { TEN_SECONDS: 10000 },
  DEBUG_LOG_FILE: 'debug.log',
}));

const mockUseGlobalToastQueue =
  require('../.opencode/plugins/helpers/toast-queue').useGlobalToastQueue;
const mockSaveToFile =
  require('../.opencode/plugins/helpers/save-to-file').saveToFile;

describe('handleDebugLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add debug toast and save to file', async () => {
    const timestamp = '2026-04-05T10:00:00.000Z';
    const title = 'DEBUG TEST';
    const data = { key: 'value' };

    await handleDebugLog(timestamp, title, data);

    expect(mockUseGlobalToastQueue().add).toHaveBeenCalledWith({
      title: 'DEBUG TEST',
      message: JSON.stringify(data, null, 2),
      variant: 'info',
      duration: 10000,
    });

    expect(mockSaveToFile).toHaveBeenCalledWith({
      content: expect.stringContaining('DEBUG TEST'),
      filename: 'debug.log',
      showToast: mockUseGlobalToastQueue().add,
    });
  });

  it('should stringify complex data correctly', async () => {
    const timestamp = '2026-04-05T10:00:00.000Z';
    const title = 'DEBUG EVENT';
    const data = { nested: { deep: 'value' }, array: [1, 2, 3] };

    await handleDebugLog(timestamp, title, data);

    expect(mockUseGlobalToastQueue().add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'DEBUG EVENT',
        variant: 'info',
        duration: 10000,
      })
    );
  });

  it('should handle empty object', async () => {
    const timestamp = '2026-04-05T10:00:00.000Z';
    const title = 'DEBUG EMPTY';
    const data = {};

    await handleDebugLog(timestamp, title, data);

    expect(mockUseGlobalToastQueue().add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'DEBUG EMPTY',
        message: '{}',
      })
    );
  });

  it('should handle null value', async () => {
    const timestamp = '2026-04-05T10:00:00.000Z';
    const title = 'DEBUG NULL';
    const data = null;

    await handleDebugLog(timestamp, title, data);

    expect(mockUseGlobalToastQueue().add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'DEBUG NULL',
        message: 'null',
      })
    );
  });
});
