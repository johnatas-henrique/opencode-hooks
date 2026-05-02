import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PluginInput } from '@opencode-ai/plugin';
import {
  createMockCtx,
  createMockClient,
  createMockDollar,
} from '../../helpers/mock-shared';
import {
  createDefaultMockSetup,
  createMockEvents,
} from '../../helpers/mock-test-helpers';

createDefaultMockSetup();

const { mockLogEvent } = vi.hoisted(() => {
  const mockLogEvent = vi.fn().mockResolvedValue(undefined);
  return { mockLogEvent };
});

const { mockEventRecorder } = vi.hoisted(() => ({
  mockEventRecorder: {
    logEvent: mockLogEvent,
    logToolExecuteBefore: async () => {},
    logToolExecuteAfter: async () => {},
    logSessionEvent: async () => {},
  },
}));

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
  let mockClient: ReturnType<typeof createMockClient>;
  let mockDollar: ReturnType<typeof createMockDollar>;

  beforeEach(async () => {
    vi.resetModules();
    mockClient = createMockClient();
    mockDollar = createMockDollar();
    vi.clearAllMocks();
    mockLogEvent.mockClear();
  });

  it('should not show toast when event is disabled', async () => {
    vi.useFakeTimers();
    vi.doMock('.opencode/plugins/core/toast-queue', () => ({
      initGlobalToastQueue: vi.fn(),
      useGlobalToastQueue: () => globalMockQueue,
    }));

    vi.doMock('.opencode/plugins/features/scripts/run-script-handler', () => ({
      isSubagent: vi.fn(),
      addSubagentSession: vi.fn(),
      resetSubagentTracking: vi.fn(),
      runScriptAndHandle: vi.fn().mockResolvedValue({
        output: 'test output',
        error: null,
        exitCode: 0,
      }),
    }));

    vi.doMock('.opencode/plugins/features/messages/show-startup-toast', () => ({
      showStartupToast: vi.fn().mockResolvedValue(undefined),
    }));

    vi.doMock('.opencode/plugins/config/settings', () => ({
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

    vi.doMock('.opencode/plugins/features/audit/plugin-integration', () => ({
      initAuditLogging: vi.fn().mockResolvedValue(undefined),
      getEventRecorder: () => mockEventRecorder,
      getScriptRecorder: vi.fn(),
      getErrorRecorder: vi.fn(),
      getLastKnownSessionId: vi.fn().mockReturnValue('ses_test123'),
      setAuditSessionId: vi.fn(),
      archiveAuditSession: vi.fn().mockResolvedValue(undefined),
    }));

    vi.doMock('.opencode/plugins/features/events/events', () => ({
      resolveEventConfig: vi.fn().mockReturnValue({
        enabled: false,
        toast: false,
        toastMessage: undefined,
        toastTitle: undefined,
        toastVariant: undefined,
        toastDuration: 0,
        runScripts: false,
        scripts: [],
        logToAudit: true,
        debug: false,
      }),
      resolveToolConfig: vi.fn(),
      handlers: {},
      getHandler: vi.fn(),
      getToolHandler: vi.fn(),
    }));

    vi.doMock('.opencode/plugins/features/scripts/executor', () => ({
      executeScript: vi
        .fn()
        .mockResolvedValue({ script: '', output: '', exitCode: 0 }),
    }));

    vi.doMock('.opencode/plugins/features/audit/script-recorder', () => ({
      createScriptRecorder: vi.fn().mockReturnValue({
        logScript: vi.fn().mockResolvedValue(undefined),
      }),
    }));

    vi.doMock(
      '.opencode/plugins/features/messages/toast-silence-detector',
      () => ({
        createToastSilenceDetector: vi.fn().mockReturnValue({
          shouldSilence: vi.fn().mockReturnValue(false),
          record: vi.fn(),
        }),
      })
    );

    vi.doMock('.opencode/plugins/features/messages/plugin-status', () => ({
      createPluginStatusManager: vi.fn().mockReturnValue({
        hasShownStatus: vi.fn().mockReturnValue(false),
        markStatusShown: vi.fn(),
      }),
    }));

    vi.doMock('.opencode/plugins/core/debug', () => ({
      handleDebugLog: vi.fn(),
    }));

    vi.doMock('.opencode/plugins/features/block-system/block-handler', () => ({
      executeBlocking: vi.fn().mockResolvedValue({ action: 'allow' }),
    }));

    vi.doMock('.opencode/plugins/features/messages/append-to-session', () => ({
      appendToSession: vi.fn().mockResolvedValue(undefined),
    }));

    vi.doMock('.opencode/plugins/features/handlers', () => ({
      handlers: {},
    }));

    const { OpencodeHooks: FreshPlugin } =
      await import('.opencode/plugins/opencode-hooks');
    const plugin = await FreshPlugin(createMockCtx(mockClient, mockDollar));

    const event = {
      type: 'session.created',
      properties: { info: { id: 's1', title: 'Test' } },
    };
    await plugin.event!({ event: event as never });

    expect(globalMockQueue.add).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
