import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PluginInput } from '@opencode-ai/plugin';
import type { EventRecorder } from '../../.opencode/plugins/types/audit';

// Mock EventRecorder's logEvent
const { mockLogEvent } = vi.hoisted(() => ({
  mockLogEvent: vi.fn().mockResolvedValue(undefined),
}));

const createMockEventRecorder = (): EventRecorder => ({
  logEvent: mockLogEvent,
  logToolExecuteBefore: async () => {},
  logToolExecuteAfter: async () => {},
  logSessionEvent: async () => {},
});

const createMockCtx = (
  client: MockClient,
  dollar: ReturnType<typeof vi.fn>
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
  tui: { showToast: ReturnType<typeof vi.fn> };
}

const createMockClient = (): MockClient => ({
  tui: { showToast: vi.fn().mockResolvedValue(undefined) },
});

const { mockQueue: globalMockQueue } = vi.hoisted(() => ({
  mockQueue: {
    add: vi.fn(),
    addMultiple: vi.fn(),
    clear: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    get pending() {
      return 0;
    },
  },
}));

describe('OpencodeHooks - logDisabledEvents', () => {
  let mockClient: MockClient;
  let mockDollar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    mockClient = createMockClient();
    mockDollar = vi
      .fn()
      .mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
    vi.clearAllMocks();

    vi.doMock('../../.opencode/plugins/core/toast-queue', () => ({
      initGlobalToastQueue: vi.fn(),
      useGlobalToastQueue: () => globalMockQueue,
    }));

    vi.doMock('../../.opencode/plugins/features/scripts/run-script', () => ({
      runScript: vi.fn(),
    }));

    vi.doMock(
      '../../.opencode/plugins/features/messages/show-startup-toast',
      () => ({ showStartupToast: vi.fn().mockResolvedValue(undefined) })
    );

    vi.doMock('../../.opencode/plugins/features/audit', () => ({
      initAuditLogging: vi.fn().mockResolvedValue(undefined),
      getEventRecorder: vi.fn().mockReturnValue(undefined),
      getScriptRecorder: vi.fn().mockReturnValue(undefined),
      getErrorRecorder: vi.fn().mockReturnValue(undefined),
      createEventRecorder: vi.fn(),
    }));
  });

  it('should call eventRecorder.logEvent when event is disabled and logDisabledEvents is true', async () => {
    vi.doMock(
      '../../.opencode/plugins/features/audit/plugin-integration',
      () => ({
        getEventRecorder: () => createMockEventRecorder(),
      })
    );

    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        toast: false,
        logToAudit: true,
        appendToSession: false,
        runScripts: false,
        logDisabledEvents: true,
        events: { 'session.created': false },
        tools: {},
        default: {
          debug: false,
          toast: false,
          runScripts: false,
          runOnlyOnce: false,
          logToAudit: true,
          appendToSession: false,
        },
        scriptToasts: {
          showOutput: true,
          showError: true,
          outputVariant: 'info',
          errorVariant: 'error',
          outputDuration: 5000,
          errorDuration: 15000,
          outputTitle: 'Output',
          errorTitle: 'Error',
        },
      },
    }));

    const { OpencodeHooks: FreshPlugin } =
      await import('../../.opencode/plugins/opencode-hooks');
    const plugin = await FreshPlugin(createMockCtx(mockClient, mockDollar));

    const event = {
      type: 'session.created',
      properties: { info: { id: 's1', title: 'Test' } },
    };
    await plugin.event!({ event: event as never });

    expect(mockLogEvent).toHaveBeenCalledWith(
      'EVENT_DISABLED',
      expect.objectContaining({ sessionID: 's1', context: 'session.created' })
    );
  });

  it('should not call eventRecorder.logEvent when event is disabled and logDisabledEvents is false', async () => {
    vi.doMock(
      '../../.opencode/plugins/features/audit/plugin-integration',
      () => ({
        getEventRecorder: () => createMockEventRecorder(),
      })
    );

    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        toast: false,
        logToAudit: true,
        appendToSession: false,
        runScripts: false,
        logDisabledEvents: false,
        events: { 'session.created': false },
        tools: {},
        default: {
          debug: false,
          toast: false,
          runScripts: false,
          runOnlyOnce: false,
          logToAudit: true,
          appendToSession: false,
        },
        scriptToasts: {
          showOutput: true,
          showError: true,
          outputVariant: 'info',
          errorVariant: 'error',
          outputDuration: 5000,
          errorDuration: 15000,
          outputTitle: 'Output',
          errorTitle: 'Error',
        },
      },
    }));

    const { OpencodeHooks: FreshPlugin } =
      await import('../../.opencode/plugins/opencode-hooks');
    const plugin = await FreshPlugin(createMockCtx(mockClient, mockDollar));
    // Clear any log calls from plugin initialization
    vi.clearAllMocks();

    const event = {
      type: 'session.created',
      properties: { info: { id: 's1', title: 'Test' } },
    };
    await plugin.event!({ event: event as never });

    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('should not show toast when event is disabled', async () => {
    vi.doMock(
      '../../.opencode/plugins/features/audit/plugin-integration',
      () => ({
        getEventRecorder: () => createMockEventRecorder(),
      })
    );

    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        toast: false,
        logToAudit: true,
        appendToSession: false,
        runScripts: false,
        logDisabledEvents: true,
        events: { 'session.created': false },
        tools: {},
        default: {
          debug: false,
          toast: false,
          runScripts: false,
          runOnlyOnce: false,
          logToAudit: true,
          appendToSession: false,
        },
        scriptToasts: {
          showOutput: true,
          showError: true,
          outputVariant: 'info',
          errorVariant: 'error',
          outputDuration: 5000,
          errorDuration: 15000,
          outputTitle: 'Output',
          errorTitle: 'Error',
        },
      },
    }));

    const { OpencodeHooks: FreshPlugin } =
      await import('../../.opencode/plugins/opencode-hooks');
    const plugin = await FreshPlugin(createMockCtx(mockClient, mockDollar));

    const event = {
      type: 'session.created',
      properties: { info: { id: 's1', title: 'Test' } },
    };
    await plugin.event!({ event: event as never });

    expect(globalMockQueue.add).not.toHaveBeenCalled();
  });
});
