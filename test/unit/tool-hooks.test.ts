import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';
import type { PluginInput } from '@opencode-ai/plugin';

const { mockRunScriptAndHandle } = vi.hoisted(() => ({
  mockRunScriptAndHandle: vi.fn(),
}));

let capturedShowFn: ((toast: unknown) => void) | null = null;

const { mockQueue: globalMockQueue } = vi.hoisted(() => ({
  mockQueue: {
    add: vi.fn((toast: unknown) => {
      if (capturedShowFn) capturedShowFn(toast);
    }),
    addMultiple: vi.fn(),
    clear: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    get pending() {
      return 0;
    },
  },
}));

vi.mock('../../.opencode/plugins/config/settings', () => ({
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

vi.mock('../../.opencode/plugins/features/scripts/run-script-handler', () => ({
  isSubagent: vi.fn().mockReturnValue(false),
  addSubagentSession: vi.fn(),
  resetSubagentTracking: vi.fn(),
  runScriptAndHandle: mockRunScriptAndHandle,
}));

vi.mock('../../.opencode/plugins/core/toast-queue', () => ({
  initGlobalToastQueue: (showFn: (toast: unknown) => void) => {
    capturedShowFn = showFn;
    return globalMockQueue;
  },
  useGlobalToastQueue: () => globalMockQueue,
  getGlobalToastQueue: () => globalMockQueue,
  resetGlobalToastQueue: vi.fn(),
}));

vi.mock('../../.opencode/plugins/features/messages/show-startup-toast', () => ({
  showStartupToast: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../.opencode/plugins/features/events/events', () => ({
  resolveEventConfig: vi.fn(),
  resolveToolConfig: vi.fn().mockReturnValue({
    enabled: true,
    toast: true,
    toastMessage: 'Running script',
    toastTitle: 'Script',
    toastVariant: 'info' as const,
    toastDuration: 2000,
    runScripts: true,
    scripts: ['tool-execute-before-read.sh'],
    logToAudit: true,
    debug: false,
    block: [],
  }),
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

vi.mock('../../.opencode/plugins/features/audit/plugin-integration', () => ({
  initAuditLogging: vi.fn().mockResolvedValue(undefined),
  getEventRecorder: () => ({
    logEvent: vi.fn(),
    logToolExecuteBefore: vi.fn(),
    logToolExecuteAfter: vi.fn(),
    logSessionEvent: vi.fn(),
  }),
  getScriptRecorder: vi.fn(),
  getErrorRecorder: vi.fn(),
}));

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
  session: {
    prompt: ReturnType<typeof vi.fn>;
  };
}

const createMockClient = (): MockClient => ({
  tui: {
    showToast: vi.fn().mockResolvedValue(undefined),
  },
  session: {
    prompt: vi.fn().mockResolvedValue(undefined),
  },
});

describe('tool.execute.before hook', () => {
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
    mockRunScriptAndHandle.mockResolvedValue({
      output: 'Script executed',
      error: null,
      exitCode: 0,
    });
  });

  it('should run script for read tool', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { tool: 'read', sessionID: 'session-123', callID: 'call-1' };
    const output = { args: {} };
    await plugin['tool.execute.before']!(input, output);

    expect(mockRunScriptAndHandle).toHaveBeenCalled();
  });
});

describe('tool.execute.after hook', () => {
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
    mockRunScriptAndHandle.mockResolvedValue({
      output: 'Script executed',
      error: null,
      exitCode: 0,
    });
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
    mockRunScriptAndHandle.mockResolvedValueOnce({
      output: '',
      error: 'Agent script failed',
      exitCode: -1,
    });

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

    expect(mockRunScriptAndHandle).toHaveBeenCalled();
    expect(globalMockQueue.add).toHaveBeenCalled();
  });
});
