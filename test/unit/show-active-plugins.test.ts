import { showActivePluginsToast } from '../../.opencode/plugins/helpers/show-active-plugins';
import { getPluginStatus } from '../../.opencode/plugins/helpers/plugin-status';

jest.mock('../../.opencode/plugins/helpers/plugin-status', () => ({
  getPluginStatus: jest.fn(),
  formatPluginStatus: jest.fn(),
}));

jest.mock('../../.opencode/plugins/helpers/user-events.config', () => ({
  userConfig: {
    showPluginStatus: true,
    pluginStatusDisplayMode: 'user-only',
  },
}));

const mockGetPluginStatus = getPluginStatus as jest.MockedFunction<
  typeof getPluginStatus
>;
const mockFormatPluginStatus = jest.requireMock(
  '../../.opencode/plugins/helpers/plugin-status'
).formatPluginStatus;

describe('showActivePluginsToast', () => {
  let mockQueue: { add: jest.Mock };
  const mockStatuses = [{ name: 'test-plugin', status: 'active' as const }];

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueue = { add: jest.fn() };
    mockGetPluginStatus.mockReturnValue(mockStatuses);
    mockFormatPluginStatus.mockReturnValue('Test plugins summary');
  });

  it('should show toast with default duration of 8000ms', async () => {
    await showActivePluginsToast(mockQueue);

    expect(mockQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plugin Status',
        message: 'Test plugins summary',
        variant: 'info',
        duration: 8000,
      })
    );
  });

  it('should show toast with custom duration when provided', async () => {
    await showActivePluginsToast(mockQueue, { duration: 15000 });

    expect(mockQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plugin Status',
        message: 'Test plugins summary',
        variant: 'info',
        duration: 15000,
      })
    );
  });

  it('should use warning variant when plugins have failed status', async () => {
    mockGetPluginStatus.mockReturnValue([
      { name: 'test-plugin', status: 'active' },
      { name: 'broken-plugin', status: 'failed', error: 'ModuleNotFound' },
    ]);

    await showActivePluginsToast(mockQueue);

    expect(mockQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'warning',
      })
    );
  });

  it('should use warning variant when plugins have incompatible status', async () => {
    mockGetPluginStatus.mockReturnValue([
      { name: 'test-plugin', status: 'active' },
      { name: 'old-plugin', status: 'incompatible' },
    ]);

    await showActivePluginsToast(mockQueue);

    expect(mockQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'warning',
      })
    );
  });

  it('should use info variant when all plugins are active', async () => {
    mockGetPluginStatus.mockReturnValue([
      { name: 'plugin1', status: 'active' },
      { name: 'plugin2', status: 'active' },
    ]);

    await showActivePluginsToast(mockQueue);

    expect(mockQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'info',
      })
    );
  });

  it('should call getPluginStatus to get current plugin states', async () => {
    await showActivePluginsToast(mockQueue);

    expect(mockGetPluginStatus).toHaveBeenCalled();
  });

  it('should call formatPluginStatus with plugin statuses', async () => {
    await showActivePluginsToast(mockQueue);

    expect(mockFormatPluginStatus).toHaveBeenCalledWith(
      mockStatuses,
      'user-only'
    );
  });
});

describe('when showPluginStatus is disabled', () => {
  let mockQueue: { add: jest.Mock };

  beforeEach(() => {
    mockQueue = { add: jest.fn() };
  });

  it('should return early and not add toast', async () => {
    const { userConfig: userConfigMock } =
      await import('../../.opencode/plugins/helpers/user-events.config');
    userConfigMock.showPluginStatus = false;

    await showActivePluginsToast(mockQueue);

    expect(mockQueue.add).not.toHaveBeenCalled();
    userConfigMock.showPluginStatus = true;
  });
});
