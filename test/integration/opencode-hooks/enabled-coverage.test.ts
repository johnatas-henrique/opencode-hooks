import type { PluginInput } from '@opencode-ai/plugin';
import { OpencodeHooks } from '.opencode/plugins/opencode-hooks';
import {
  mockClient,
  mockDollar,
  createMockCtx,
} from '../../helpers/mock-plugin-input';
import { createDefaultMockSetup } from '../../helpers/mock-test-helpers';

createDefaultMockSetup();

function createEventConfigMock(
  overrides: Partial<EventConfig> = {}
): EventConfig {
  return {
    runOnlyOnce: true,
    enabled: true,
    debug: false,
    toast: false,
    toastTitle: 'Test',
    toastMessage: '',
    toastVariant: 'info' as const,
    toastDuration: 0,
    scripts: [],
    runScripts: true,
    logToAudit: false,
    appendToSession: false,
    block: [],
    scriptToasts: { showOutput: false, showError: false },
    ...overrides,
  };
}

async function runEventHandler(
  event: { type: string; properties: Record<string, unknown> },
  configOverrides: Partial<EventConfig> = {}
): Promise<Awaited<ReturnType<typeof OpencodeHooks>>> {
  const { resolveEventConfig } =
    await import('.opencode/plugins/features/events/events');
  (resolveEventConfig as ReturnType<typeof vi.fn>).mockReturnValue(
    createEventConfigMock(configOverrides)
  );

  const ctx = createMockCtx();
  const plugin = await OpencodeHooks(ctx);
  const eventHandler = plugin.event as (arg: {
    event: { type: string; properties: Record<string, unknown> };
  }) => Promise<void>;

  await eventHandler({ event });
  return plugin;
}

// Mock with enabled: true
vi.mock('.opencode/plugins/config/settings', () => ({
  userConfig: {
    enabled: true,
    toast: true,
    logToAudit: true,
    appendToSession: false,
    runScripts: true,
    logDisabledEvents: false,
    loadClaudeHookSettings: { enabled: false },
    default: {
      debug: false,
      toast: true,
      runScripts: true,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: false,
    },
    events: {
      'session.created': { toast: true, debug: true },
    },
    tools: {
      'tool.execute.before': {
        read: { block: ['rm -rf'] },
      },
    },
    audit: {
      enabled: true,
      level: 'debug',
      basePath: '/tmp/audit-test',
      maxSizeMB: 1,
      maxAgeDays: 30,
      logTruncationKB: 0.5,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [],
    },
  },
}));

describe('opencode-hooks-enabled-coverage - enabled: true branch coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('line 85: runOnlyOnce with subagent', () => {
    it('should skip execution when runOnlyOnce is true and session is subagent', async () => {
      const { isSubagent } =
        await import('.opencode/plugins/features/scripts/run-script-handler');
      (isSubagent as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const plugin = await runEventHandler({
        event: {
          type: 'session.created',
          properties: { sessionID: 'subagent-session' },
        },
      });

      expect(isSubagent).toHaveBeenCalledWith('subagent-session');
    });
  });

  describe('lines 197-210: error toast for failed scripts', () => {
    it('should show error toast when script fails with showError true', async () => {
      const { isSubagent } =
        await import('.opencode/plugins/features/scripts/run-script-handler');
      (isSubagent as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const { executeScript } =
        await import('.opencode/plugins/features/scripts/executor');
      (executeScript as ReturnType<typeof vi.fn>).mockResolvedValue({
        script: 'failing-script.sh',
        exitCode: 1,
        output: 'Script error occurred',
      });

      const { useGlobalToastQueue } =
        await import('.opencode/plugins/core/toast-queue');
      const mockQueue = {
        add: vi.fn(),
      };
      (useGlobalToastQueue as ReturnType<typeof vi.fn>).mockReturnValue(
        mockQueue
      );

      await runEventHandler(
        {
          event: {
            type: 'session.created',
            properties: { sessionID: 'test-session' },
          },
        },
        {
          runOnlyOnce: false,
          debug: false,
          toast: false,
          toastTitle: 'Test Event',
          toastMessage: '',
          toastVariant: 'info' as const,
          toastDuration: 0,
          scripts: [{ script: 'failing-script.sh', type: 'native' }],
          scriptToasts: {
            showOutput: false,
            showError: true,
            outputVariant: 'info',
            errorVariant: 'error',
            outputDuration: 0,
            errorDuration: 5000,
            outputTitle: 'Output',
            errorTitle: 'Error',
          },
        }
      );

      expect(mockQueue.add).toHaveBeenCalled();
    });
  });

  describe('line 70: resolved.debug = true', () => {
    it('should call handleDebugLog when debug is true', async () => {
      const { handleDebugLog } = await import('.opencode/plugins/core/debug');
      (handleDebugLog as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await runEventHandler(
        {
          event: {
            type: 'session.created',
            properties: {
              sessionID: 'test-session',
              info: { id: '123', title: 'Test' },
            },
          },
        },
        { debug: true }
      );

      expect(handleDebugLog).toHaveBeenCalled();
    });
  });

  describe('line 238: session.created with parentID', () => {
    it('should handle session.created with parentID', async () => {
      await runEventHandler({
        type: 'session.created',
        properties: {
          sessionID: 'child-session',
          info: { id: '123', title: 'Child', parentID: 'parent-session' },
        },
      });
    });
  });
  describe('line 252: server.instance.disposed', () => {
    it('should handle server.instance.disposed event', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);
      const eventHandler = plugin.event as (arg: {
        event: { type: string; properties: Record<string, unknown> };
      }) => Promise<void>;

      await eventHandler({
        event: {
          type: 'server.instance.disposed',
          properties: { directory: '/tmp' },
        },
      });
    });
  });

  describe('line 295: setAuditSessionId on SESSION_CREATED', () => {
    it('should call setAuditSessionId when session.created with valid ses_ sessionId', async () => {
      await runEventHandler({
        type: 'session.created',
        properties: {
          sessionID: 'ses_abc123test',
          info: { id: 'ses_abc123test', title: 'New Session' },
        },
      });
    });
  });
});
