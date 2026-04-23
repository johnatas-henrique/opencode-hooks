import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';
import type { PluginInput } from '../__mocks__/@opencode-ai/plugin';

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

vi.mock('../../.opencode/plugins/features/scripts/run-script', () => ({
  runScript: mockRunScript,
}));

vi.mock('../../.opencode/plugins/core/debug', () => ({
  handleDebugLog: mockHandleDebugLog,
}));

vi.mock('../../.opencode/plugins/features/messages/append-to-session', () => ({
  appendToSession: mockAppendToSession,
}));

vi.mock('../../.opencode/plugins/features/messages/default-handlers', () => ({
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

  it('should still show toast when runOnlyOnce skips script', async () => {
    vi.resetModules();

    vi.doMock('../../.opencode/plugins/config', () => ({
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
          'session.created': {
            toast: true,
            runScripts: true,
            runOnlyOnce: true,
          },
        },
        tools: {},
        default: {
          debug: false,
          toast: false,
          runScripts: false,
          runOnlyOnce: false,
          logToAudit: true,
          appendToSession: false,
        },
      },
    }));

    const mockRunScriptFn2 = vi.fn().mockResolvedValue({
      output: 'Script executed',
      error: null,
      exitCode: 0,
    });
    vi.doMock('../../.opencode/plugins/features/scripts/run-script', () => ({
      runScript: mockRunScriptFn2,
    }));

    const { OpencodeHooks: FreshPlugin2 } =
      await import('../../.opencode/plugins/opencode-hooks');
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await FreshPlugin2(ctx);

    mockRunScriptFn2.mockClear();
    mockClient.tui.showToast.mockClear();

    const event1 = {
      type: 'session.created',
      properties: { info: { id: 'session-1', title: 'Main' } },
    };
    await plugin.event!({ event: event1 as never });

    const toastCountAfterFirst = mockClient.tui.showToast.mock.calls.length;

    const event2 = {
      type: 'session.created',
      properties: {
        info: { id: 'session-2', parentID: 'session-1', title: 'Subagent' },
      },
    };
    await plugin.event!({ event: event2 as never });

    expect(mockClient.tui.showToast.mock.calls.length).toBe(
      toastCountAfterFirst + 1
    );
  });
});

describe('executeHook - debug mode', () => {
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

  it('should call handleDebugLog when debug is enabled in event handler', async () => {
    vi.useFakeTimers();
    vi.resetModules();

    vi.doMock('../../.opencode/plugins/config', () => ({
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
          'session.created': { debug: true, runScripts: false },
        },
        tools: {},
        default: {
          debug: false,
          toast: false,
          runScripts: false,
          runOnlyOnce: false,
          logToAudit: true,
          appendToSession: false,
        },
      },
    }));

    vi.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'session.created': {
            title: '====SESSION CREATED====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'session-created.sh',
            buildMessage: () => 'session created',
          },
        },
      })
    );

    const mockHandleDebugLog = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../../.opencode/plugins/core/debug', () => ({
      handleDebugLog: mockHandleDebugLog,
    }));

    const { OpencodeHooks: DebugPlugin } =
      await import('../../.opencode/plugins/opencode-hooks');
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await DebugPlugin(ctx);

    const event = {
      type: 'session.created',
      properties: { info: { id: 'test-session', title: 'Test' } },
    };
    await plugin.event!({ event: event as never });

    expect(mockHandleDebugLog).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('new hooks', () => {
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
    // Hook should execute without errors (old saveToFile assertion removed)
  });
});

describe('plugin disabled', () => {
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

  it('should return empty object when plugin is disabled', async () => {
    vi.resetModules();
    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: false,
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
        events: {},
        tools: {},
      },
    }));

    const { OpencodeHooks: DisabledHooks } =
      await import('../../.opencode/plugins/opencode-hooks');
    const plugin = await DisabledHooks({
      client: mockClient,
      $: mockDollar,
    } as unknown as PluginInput);

    expect(plugin).toEqual({});
  });
});
