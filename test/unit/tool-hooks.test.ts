import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';
import type { PluginInput } from '../__mocks__/@opencode-ai/plugin';

const { mockRunScript } = vi.hoisted(() => ({
  mockRunScript: vi.fn(),
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

vi.mock('../../.opencode/plugins/config', async () => {
  const actual = (await vi.importActual('../../.opencode/plugins/config')) as {
    userConfig: {
      events: Record<string, unknown>;
      tools: Record<string, unknown>;
    };
  };
  return {
    ...actual,
    userConfig: {
      ...actual.userConfig,
      enabledEvents: [
        'tool.execute.before',
        'tool.execute.after',
        'tool.execute.after.subagent',
        'shell.env',
      ],
      disabledEvents: [],
      logToFile: true,
      events: {
        ...actual.userConfig.events,
        'shell.env': {
          toast: true,
          runScripts: true,
          scripts: ['shell-env.sh'],
        },
        'tool.execute.after.subagent': {
          runScripts: true,
          toast: true,
          scripts: ['after-task.sh'],
        },
      },
      tools: {
        'tool.execute.before': {
          read: { runScripts: true, toast: true },
          write: { runScripts: false, toast: false },
          disabled: { enabled: false },
        },
        'tool.execute.after': {
          task: { runScripts: true, toast: true },
          read: { toast: true },
        },
      },
    },
  };
});

vi.mock('../../.opencode/plugins/features/scripts/run-script', () => ({
  runScript: mockRunScript,
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
    mockRunScript.mockResolvedValue({
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

    expect(mockRunScript).toHaveBeenCalledWith(
      mockDollar,
      'tool-execute-before-read.sh',
      'read'
    );
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
    mockRunScript.mockResolvedValue({
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
    mockRunScript.mockResolvedValueOnce({
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

    const errorToastCall = globalMockQueue.add.mock.calls.find(
      (call: [unknown]) => (call[0] as { variant: string }).variant === 'error'
    );

    expect(errorToastCall).toBeDefined();
    expect((errorToastCall as unknown[])[0]).toBeDefined();
    expect((errorToastCall as unknown[])[0] as { title: string }).toBeDefined();
    expect(
      (errorToastCall as unknown[])[0] as { message: string }
    ).toBeDefined();
  });
});
