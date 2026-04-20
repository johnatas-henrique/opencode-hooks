import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PluginInput } from '@opencode-ai/plugin';

const createMockCtx = (
  client: MockClient,
  dollar: () => Promise<{ exitCode: number; stdout: string; stderr: string }>
): PluginInput => ({
  client: client as unknown as PluginInput['client'],
  $: dollar as unknown as PluginInput['$'],
  project: 'test-project' as unknown as PluginInput['project'],
  directory: '/test/dir' as unknown as PluginInput['directory'],
  worktree: '/test/dir' as unknown as PluginInput['worktree'],
  serverUrl: 'http://localhost:3000' as unknown as PluginInput['serverUrl'],
  experimental_workspace: {
    register: vi.fn(),
  } as unknown as PluginInput['experimental_workspace'],
});

interface MockClient {
  tui: {
    showToast: ReturnType<typeof vi.fn>;
  };
}

const createMockClient = (): MockClient => ({
  tui: {
    showToast: vi.fn().mockResolvedValue(undefined),
  },
});

const { mockQueue: globalMockQueue } = vi.hoisted(() => {
  const mockQueue = {
    add: vi.fn(),
    addMultiple: vi.fn(),
    clear: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    get pending() {
      return 0;
    },
  };
  return { mockQueue };
});

const { mockSaveToFile } = vi.hoisted(() => ({
  mockSaveToFile: vi.fn().mockResolvedValue(undefined),
}));

describe('OpencodeHooks - logDisabledEvents', () => {
  let mockClient: MockClient;
  let mockDollar: () => Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }>;

  beforeEach(() => {
    mockClient = createMockClient();
    mockDollar = vi
      .fn<() => Promise<{ exitCode: number; stdout: string; stderr: string }>>()
      .mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    vi.clearAllMocks();
  });

  it('should call saveToFile when event is disabled and logDisabledEvents is true', async () => {
    vi.resetModules();

    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        toast: false,
        saveToFile: true,
        appendToSession: false,
        runScripts: false,
        logDisabledEvents: true,
        events: {
          'session.created': false,
        },
        tools: {},
      },
    }));

    vi.doMock(
      '../../.opencode/plugins/features/persistence/save-to-file',
      () => ({
        saveToFile: mockSaveToFile,
      })
    );

    vi.doMock('../../.opencode/plugins/core/toast-queue', () => ({
      initGlobalToastQueue: vi.fn(),
      useGlobalToastQueue: () => globalMockQueue,
    }));

    vi.doMock('../../.opencode/plugins/features/scripts/run-script', () => ({
      runScript: vi.fn(),
    }));

    vi.doMock(
      '../../.opencode/plugins/features/messages/show-startup-toast',
      () => ({
        showStartupToast: vi.fn().mockResolvedValue(undefined),
      })
    );

    vi.doMock('../../.opencode/plugins/audit', () => ({
      initAuditLogging: vi.fn().mockResolvedValue(undefined),
    }));

    const { OpencodeHooks: FreshPlugin } =
      await import('../../.opencode/plugins/opencode-hooks');
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await FreshPlugin(ctx);

    mockSaveToFile.mockClear();

    const event = {
      type: 'session.created',
      properties: { info: { id: 'session-1', title: 'Test' } },
    };
    await plugin.event!({ event: event as never });

    expect(mockSaveToFile).toHaveBeenCalledWith({
      content: expect.stringContaining('"type":"EVENT_DISABLED"'),
      showToast: expect.any(Function),
    });
    expect(mockSaveToFile.mock.calls[0][0].content).toContain(
      '"data":"session.created"'
    );
    expect(mockSaveToFile.mock.calls[0][0].content).toContain('"timestamp"');
  });

  it('should not call saveToFile when event is disabled and logDisabledEvents is false', async () => {
    vi.resetModules();

    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        toast: false,
        saveToFile: true,
        appendToSession: false,
        runScripts: false,
        logDisabledEvents: false,
        events: {
          'session.created': false,
        },
        tools: {},
      },
    }));

    vi.doMock(
      '../../.opencode/plugins/features/persistence/save-to-file',
      () => ({
        saveToFile: mockSaveToFile,
      })
    );

    vi.doMock('../../.opencode/plugins/core/toast-queue', () => ({
      initGlobalToastQueue: vi.fn(),
      useGlobalToastQueue: () => globalMockQueue,
    }));

    vi.doMock('../../.opencode/plugins/features/scripts/run-script', () => ({
      runScript: vi.fn(),
    }));

    vi.doMock(
      '../../.opencode/plugins/features/messages/show-startup-toast',
      () => ({
        showStartupToast: vi.fn().mockResolvedValue(undefined),
      })
    );

    vi.doMock('../../.opencode/plugins/audit', () => ({
      initAuditLogging: vi.fn().mockResolvedValue(undefined),
    }));

    const { OpencodeHooks: FreshPlugin } =
      await import('../../.opencode/plugins/opencode-hooks');
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await FreshPlugin(ctx);

    mockSaveToFile.mockClear();

    const event = {
      type: 'session.created',
      properties: { info: { id: 'session-1', title: 'Test' } },
    };
    await plugin.event!({ event: event as never });

    expect(mockSaveToFile).not.toHaveBeenCalled();
  });

  it('should call toast queue add when saving disabled event', async () => {
    vi.resetModules();

    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        toast: false,
        saveToFile: true,
        appendToSession: false,
        runScripts: false,
        logDisabledEvents: true,
        events: {
          'tool.execute.before': false,
        },
        tools: {},
      },
    }));

    vi.doMock(
      '../../.opencode/plugins/features/persistence/save-to-file',
      () => ({
        saveToFile: mockSaveToFile,
      })
    );

    vi.doMock('../../.opencode/plugins/core/toast-queue', () => ({
      initGlobalToastQueue: vi.fn(),
      useGlobalToastQueue: () => globalMockQueue,
    }));

    vi.doMock('../../.opencode/plugins/features/scripts/run-script', () => ({
      runScript: vi.fn(),
    }));

    vi.doMock(
      '../../.opencode/plugins/features/messages/show-startup-toast',
      () => ({
        showStartupToast: vi.fn().mockResolvedValue(undefined),
      })
    );

    vi.doMock('../../.opencode/plugins/audit', () => ({
      initAuditLogging: vi.fn().mockResolvedValue(undefined),
    }));

    const { OpencodeHooks: FreshPlugin } =
      await import('../../.opencode/plugins/opencode-hooks');
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await FreshPlugin(ctx);

    mockSaveToFile.mockClear();
    globalMockQueue.add.mockClear();

    const event = {
      type: 'tool.execute.before',
      properties: { tool: 'bash', callID: 'call-1' },
    };
    await plugin.event!({ event: event as never });

    expect(mockSaveToFile).toHaveBeenCalledTimes(1);
    expect(globalMockQueue.add).not.toHaveBeenCalled();

    const showToastFn = mockSaveToFile.mock.calls[0][0].showToast;
    showToastFn();
    expect(globalMockQueue.add).toHaveBeenCalledTimes(1);
  });
});
