import { showActivePluginsToast } from '../../.opencode/plugins/features/messages/show-active-plugins';
import {
  _getPluginStatus,
  _formatPluginStatus,
} from '../../.opencode/plugins/features/messages/plugin-status';

const { mockGetPluginStatus, mockFormatPluginStatus } = vi.hoisted(() => ({
  mockGetPluginStatus: vi.fn(),
  mockFormatPluginStatus: vi.fn(),
}));

vi.mock('../../.opencode/plugins/features/messages/plugin-status', () => ({
  getPluginStatus: mockGetPluginStatus,
  formatPluginStatus: mockFormatPluginStatus,
}));

vi.mock('../../.opencode/plugins/config', () => ({
  userConfig: {
    showPluginStatus: true,
    pluginStatusDisplayMode: 'user-only',
  },
}));

describe('showActivePluginsToast', () => {
  let mockQueue: { add: vi.Mock };
  const mockStatuses = [{ name: 'test-plugin', status: 'active' as const }];

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueue = { add: vi.fn() };
    mockGetPluginStatus.mockReturnValue(mockStatuses);
    mockFormatPluginStatus.mockReturnValue('Test plugins summary');
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

  it('should call formatPluginStatus with plugin statuses', async () => {
    await showActivePluginsToast(mockQueue);

    expect(mockFormatPluginStatus).toHaveBeenCalledWith(
      mockStatuses,
      'user-only'
    );
  });
});

describe('when showPluginStatus is disabled', () => {
  let mockQueue: { add: vi.Mock };

  beforeEach(() => {
    mockQueue = { add: vi.fn() };
  });

  it('should return early and not add toast', async () => {
    vi.resetModules();
    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        showPluginStatus: false,
        pluginStatusDisplayMode: 'user-only',
      },
    }));

    const { showActivePluginsToast: showDisabled } =
      await import('../../.opencode/plugins/features/messages/show-active-plugins');
    await showDisabled(mockQueue);

    expect(mockQueue.add).not.toHaveBeenCalled();

    vi.resetModules();
    vi.doUnmock('../../.opencode/plugins/config');
  });
});
