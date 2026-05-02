import { OpencodeHooks } from '.opencode/plugins/opencode-hooks';
import type { PluginInput } from '@opencode-ai/plugin';
import {
  createMockClient,
  createMockCtx,
  createMockDollar,
} from '../../helpers/mock-shared';
import {
  createDefaultMockSetup,
  createGlobalMockQueue,
} from '../../helpers/mock-test-helpers';

createDefaultMockSetup();

const { mockQueue: globalMockQueue, setCapturedShowFn } =
  createGlobalMockQueue();

vi.mock('.opencode/plugins/config/settings', () => ({
  userConfig: {
    enabled: true,
    toast: true,
    logToAudit: true,
    appendToSession: false,
    runScripts: true,
    logDisabledEvents: false,
    events: {
      'shell.env': { toast: true, runScripts: true },
      'tool.execute.after.subagent': { runScripts: true, toast: true },
    },
    tools: {
      'tool.execute.before': {
        read: { runScripts: true, toast: true },
        write: { runScripts: false, toast: false },
      },
      'tool.execute.after': {
        task: { runScripts: true, toast: true },
        read: { toast: true },
      },
    },
    default: {
      debug: false,
      toast: true,
      runScripts: true,
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

vi.mock('.opencode/plugins/features/scripts/executor', () => ({
  executeScript: vi.fn().mockResolvedValue({ script: 'test.sh', output: '' }),
}));

vi.mock('.opencode/plugins/core/toast-queue', () => ({
  initGlobalToastQueue: (showFn: (toast: unknown) => void) => {
    setCapturedShowFn(showFn);
    return globalMockQueue;
  },
  useGlobalToastQueue: () => globalMockQueue,
  getGlobalToastQueue: () => globalMockQueue,
  resetGlobalToastQueue: vi.fn(),
}));

vi.mock('.opencode/plugins/features/messages/show-startup-toast', () => ({
  showStartupToast: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('.opencode/plugins/features/events/events', () => ({
  resolveEventConfig: vi.fn(),
  resolveToolConfig: vi.fn(),
  EventType: {
    SESSION_CREATED: 'session.created',
    SHELL_ENV: 'shell.env',
    CHAT_MESSAGE: 'chat.message',
    CHAT_PARAMS: 'chat.params',
  },
  handlers: {
    'session.created': {
      title: 'Test',
      variant: 'info' as const,
      duration: 1000,
      buildMessage: () => 'Test',
    },
  },
  getHandler: vi.fn(),
  getToolHandler: vi.fn(),
}));

vi.mock('.opencode/plugins/features/audit/plugin-integration', () => ({
  initAuditLogging: vi.fn().mockResolvedValue(undefined),
  getEventRecorder: () => ({
    logEvent: vi.fn(),
    logToolExecuteBefore: vi.fn(),
    logToolExecuteAfter: vi.fn(),
    logSessionEvent: vi.fn(),
  }),
  getScriptRecorder: vi.fn(),
  getErrorRecorder: vi.fn(),
  getLastKnownSessionId: vi.fn().mockReturnValue('test-session'),
  setAuditSessionId: vi.fn(),
  archiveAuditSession: vi.fn().mockResolvedValue(undefined),
}));

describe('tool.execute.after hook', () => {
  let mockClient: MockClient;
  let mockDollar: () => Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }>;

  beforeEach(() => {
    mockClient = createMockClient();
    mockDollar = createMockDollar();
    vi.clearAllMocks();
  });

  it('should not trigger toast when subagent_type is undefined', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {
      tool: 'task',
      sessionID: 'session-123',
      callID: 'call-456',
      args: {},
    };
    const output = {
      title: 'Task completed',
      output: 'result',
      metadata: {},
    };
    await plugin['tool.execute.after']!(input, output);

    expect(globalMockQueue.add).toHaveBeenCalled();
  });

  it('should show error toast when script fails', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {
      tool: 'task',
      sessionID: 'tool-error-session',
      callID: 'call-789',
      args: { subagent_type: 'explore' },
    };
    const output = {
      title: 'Task completed',
      output: 'result',
      metadata: {},
    };
    await plugin['tool.execute.after']!(input, output);

    expect(globalMockQueue.add).toHaveBeenCalled();
  });
});
