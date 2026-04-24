import { showActivePluginsToast } from '../../.opencode/plugins/features/messages/show-active-plugins';

const { mockGetPluginStatus, mockFormatPluginStatus, mockQueue } = vi.hoisted(
  () => ({
    mockGetPluginStatus: vi.fn(),
    mockFormatPluginStatus: vi.fn(),
    mockQueue: {
      add: vi.fn(),
      addMultiple: vi.fn(),
      clear: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
      get pending() {
        return 0;
      },
    },
  })
);

vi.mock('../../.opencode/plugins/features/messages/plugin-status', () => ({
  getPluginStatus: mockGetPluginStatus,
  formatPluginStatus: mockFormatPluginStatus,
}));

vi.mock('../../.opencode/plugins/config/settings', () => ({
  userConfig: {
    showPluginStatus: true,
    pluginStatusDisplayMode: 'user-only',
    audit: {
      enabled: true,
      level: 'debug',
      basePath: '/tmp/audit-test',
      maxSizeMB: 1,
      maxAgeDays: 30,
      truncationKB: 0.5,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [],
    },
  },
}));

describe('showActivePluginsToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPluginStatus.mockReturnValue([
      { name: 'test-plugin', status: 'active' },
    ]);
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
      [{ name: 'test-plugin', status: 'active' }],
      'user-only'
    );
  });
});

describe('when showPluginStatus is disabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return early and not add toast', async () => {
    vi.resetModules();

    vi.doMock('../../.opencode/plugins/config/settings', () => ({
      userConfig: {
        showPluginStatus: false,
        pluginStatusDisplayMode: 'user-only',
        audit: {
          enabled: true,
          level: 'debug',
          basePath: '/tmp/audit-test',
          maxSizeMB: 1,
          maxAgeDays: 30,
          truncationKB: 0.5,
          maxFieldSize: 1000,
          maxArrayItems: 50,
          largeFields: [],
        },
      },
    }));

    const { showActivePluginsToast: showDisabled } =
      await import('../../.opencode/plugins/features/messages/show-active-plugins');
    await showDisabled(mockQueue);

    expect(mockQueue.add).not.toHaveBeenCalled();
  });
});
