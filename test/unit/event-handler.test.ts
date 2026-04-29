import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';
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

const { mockRunScript, mockHandleDebugLog, mockAppendToSession } = vi.hoisted(
  () => ({
    mockRunScript: vi.fn().mockResolvedValue({
      output: 'Script executed',
      error: null,
      exitCode: 0,
    }),
    mockHandleDebugLog: vi.fn().mockResolvedValue(undefined),
    mockAppendToSession: vi.fn().mockResolvedValue(undefined),
  })
);

vi.mock('../../.opencode/plugins/features/scripts/run-script-handler', () => ({
  isSubagent: vi.fn(),
  addSubagentSession: vi.fn(),
  resetSubagentTracking: vi.fn(),
  runScriptAndHandle: mockRunScript,
}));

vi.mock('../../.opencode/plugins/core/debug', () => ({
  handleDebugLog: mockHandleDebugLog,
}));

vi.mock('../../.opencode/plugins/features/messages/append-to-session', () => ({
  appendToSession: mockAppendToSession,
}));

vi.mock('../../.opencode/plugins/features/handlers', () => ({
  handlers: {
    'session.created': {
      title: '====SESSION CREATED====',
      variant: 'success',
      duration: 2000,
      defaultScript: 'session-created.sh',
      buildMessage: (event: Record<string, unknown>) => {
        const props = event.properties as Record<string, unknown> | undefined;
        const info = props?.info as Record<string, unknown> | undefined;
        return `Session Id: ${String(info?.id ?? '')}\nTime: now`;
      },
    },
    'tool.execute.before': {
      title: '====TOOL EXECUTE BEFORE====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-before.sh',
      buildMessage: (event: Record<string, unknown>) => {
        const props = event.properties as Record<string, unknown> | undefined;
        return `Tool: ${String(props?.tool ?? 'unknown')}\nTime: now`;
      },
    },
    'tool.execute.after': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-after.sh',
      buildMessage: (event: Record<string, unknown>) => {
        const props = event.properties as Record<string, unknown> | undefined;
        return `Session Id: ${String(props?.sessionID ?? 'unknown')}\nTime: now`;
      },
    },
    'tool.execute.after.subagent': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'log-agent.sh',
      buildMessage: (event: Record<string, unknown>) => {
        const props = event.properties as Record<string, unknown> | undefined;
        return `Agent: ${String(props?.subagentType ?? 'unknown')}\nTime: now`;
      },
    },
    'shell.env': {
      title: '====SHELL ENV====',
      variant: 'info',
      duration: 0,
      defaultScript: 'shell-env.sh',
      buildMessage: () => 'shell env',
    },
    'unknown.event': {
      title: '====UNKNOWN====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'unknown.sh',
      buildMessage: () => 'unknown',
    },
  },
}));

vi.mock('../../.opencode/plugins/config', () => ({
  userConfig: {
    enabled: true,
    audit: {
      enabled: true,
      level: 'debug',
      basePath: '/tmp/audit-test/test',
      maxSizeMB: 1,
      maxAgeDays: 30,
      truncationKB: 0.5,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [],
    },
    toast: true,
    logToAudit: true,
    appendToSession: true,
    runScripts: true,
    scriptToasts: {
      showOutput: true,
      showError: true,
      outputVariant: 'info',
      errorVariant: 'error',
      outputDuration: 5000,
      errorDuration: 15000,
    },
    events: {
      'session.created': true,
      'unknown.event': true,
    },
    tools: {},
  },
}));

const { mockQueue: globalMockQueue, setCapturedShowFn } = vi.hoisted(() => {
  let capturedShowFn: ((toast: unknown) => void) | null = null;
  const mockQueue = {
    add: vi.fn((toast: unknown) => {
      if (capturedShowFn) capturedShowFn(toast);
    }),
    addMultiple: vi.fn(),
    clear: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    get pending() {
      return 0;
    },
  };
  const setCapturedShowFn = (fn: (toast: unknown) => void) => {
    capturedShowFn = fn;
  };
  const getQueue = () => mockQueue;
  return { mockQueue, setCapturedShowFn, getQueue };
});

vi.mock('../../.opencode/plugins/core/toast-queue', () => ({
  ...vi.importActual('../../.opencode/plugins/core/toast-queue'),
  initGlobalToastQueue: (showFn: (toast: unknown) => void) => {
    setCapturedShowFn(showFn);
    return globalMockQueue;
  },
  useGlobalToastQueue: () => globalMockQueue,
  getGlobalToastQueue: () => globalMockQueue,
  resetGlobalToastQueue: vi.fn(),
}));

vi.mock('../../.opencode/plugins/features/messages/show-startup-toast', () => ({
  showStartupToast: vi.fn().mockResolvedValue(undefined),
}));

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

describe('event handler', () => {
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

  it('should handle experimental.text.complete hook', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {
      sessionID: 'text-session-123',
      messageID: 'msg-789',
      partID: 'part-111',
    };
    const output = { text: 'completed' };

    await plugin['experimental.text.complete']!(input, output);
  });
});
