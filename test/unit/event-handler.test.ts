import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';
import type {
  PluginInput,
  PluginClient,
  PluginDollar,
} from '../__mocks__/@opencode-ai/plugin';

const createMockCtx = (
  client: PluginClient,
  dollar: PluginDollar
): PluginInput => ({
  client,
  $: dollar,
  project: 'test-project',
  directory: '/test/dir',
  worktree: '/test/dir',
  serverUrl: 'http://localhost:3000',
});

const {
  mockRunScript,
  mockSaveToFile,
  mockHandleDebugLog,
  mockAppendToSession,
} = vi.hoisted(() => ({
  mockRunScript: vi
    .fn()
    .mockResolvedValue({ output: 'Script executed', error: null, exitCode: 0 }),
  mockSaveToFile: vi.fn().mockResolvedValue(undefined),
  mockHandleDebugLog: vi.fn().mockResolvedValue(undefined),
  mockAppendToSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../.opencode/plugins/features/scripts/run-script', () => ({
  runScript: mockRunScript,
}));

vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: mockSaveToFile,
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
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties?.info?.id}\nTime: now`,
    },
    'tool.execute.before': {
      title: '====TOOL EXECUTE BEFORE====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-before.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Tool: ${event.properties?.tool || 'unknown'}\nTime: now`,
    },
    'tool.execute.after': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-after.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties?.sessionID || 'unknown'}\nTime: now`,
    },
    'tool.execute.after.subagent': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'log-agent.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Agent: ${event.properties?.subagentType || 'unknown'}\nTime: now`,
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
    toast: true,
    saveToFile: true,
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

  it('should return early when no handler exists for event type', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const event = {
      type: 'unknown.event',
      properties: { sessionID: 'test-123' },
    };
    await plugin.event({ event });

    expect(mockSaveToFile).toHaveBeenCalled();
  });

  it('should skip script for subagent sessions when runOnlyOnce is true', async () => {
    vi.resetModules();

    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        toast: true,
        saveToFile: true,
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
          'session.created': { runScripts: true, runOnlyOnce: true },
        },
        tools: {},
      },
    }));

    const mockRunScriptFn = vi.fn().mockResolvedValue({
      output: 'Script executed',
      error: null,
      exitCode: 0,
    });
    vi.doMock('../../.opencode/plugins/features/scripts/run-script', () => ({
      runScript: mockRunScriptFn,
    }));

    const { OpencodeHooks: FreshPlugin } =
      await import('../../.opencode/plugins/opencode-hooks');
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await FreshPlugin(ctx);

    mockRunScriptFn.mockClear();

    const event1 = {
      type: 'session.created',
      properties: { info: { id: 'session-1', title: 'Main' } },
    };
    await plugin.event({ event: event1 });

    expect(mockRunScriptFn).toHaveBeenCalledTimes(1);

    const event2 = {
      type: 'session.created',
      properties: {
        info: { id: 'session-2', parentID: 'session-1', title: 'Subagent' },
      },
    };
    await plugin.event({ event: event2 });

    expect(mockRunScriptFn).toHaveBeenCalledTimes(1);
  });

  it('should run script for multiple primary sessions when runOnlyOnce is true', async () => {
    vi.resetModules();

    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        toast: true,
        saveToFile: true,
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
          'session.created': { runScripts: true, runOnlyOnce: true },
        },
        tools: {},
      },
    }));

    const mockRunScriptFn = vi.fn().mockResolvedValue({
      output: 'Script executed',
      error: null,
      exitCode: 0,
    });
    vi.doMock('../../.opencode/plugins/features/scripts/run-script', () => ({
      runScript: mockRunScriptFn,
    }));

    const { OpencodeHooks: FreshPlugin } =
      await import('../../.opencode/plugins/opencode-hooks');
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await FreshPlugin(ctx);

    mockRunScriptFn.mockClear();

    const event1 = {
      type: 'session.created',
      properties: { info: { id: 'session-1', title: 'Main' } },
    };
    const event2 = {
      type: 'session.created',
      properties: { info: { id: 'session-2', title: 'Second' } },
    };
    const event3 = {
      type: 'session.created',
      properties: { info: { id: 'session-3', title: 'Third' } },
    };

    await plugin.event({ event: event1 });
    await plugin.event({ event: event2 });
    await plugin.event({ event: event3 });

    expect(mockRunScriptFn).toHaveBeenCalledTimes(3);
  });

  it('should still show toast when runOnlyOnce skips script', async () => {
    vi.resetModules();

    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        toast: true,
        saveToFile: true,
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
    await plugin.event({ event: event1 });

    const toastCountAfterFirst = mockClient.tui.showToast.mock.calls.length;

    const event2 = {
      type: 'session.created',
      properties: {
        info: { id: 'session-2', parentID: 'session-1', title: 'Subagent' },
      },
    };
    await plugin.event({ event: event2 });

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

  it('should call handleDebugLog when debug is enabled in executeHook', async () => {
    vi.resetModules();

    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        toast: true,
        saveToFile: true,
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
          'shell.env': { debug: true, runScripts: false },
        },
        tools: {},
      },
    }));

    vi.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'shell.env': {
            title: '====SHELL ENV====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'shell-env.sh',
            buildMessage: () => 'shell env',
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

    const input = { cwd: '/test/dir' };
    const output = { env: {} };
    await plugin['shell.env'](input as unknown, output as unknown);

    expect(mockHandleDebugLog).toHaveBeenCalled();
  });

  it('should call handleDebugLog when debug is enabled in event handler', async () => {
    vi.useFakeTimers();
    vi.resetModules();

    vi.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        toast: true,
        saveToFile: true,
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
    await plugin.event({ event: event as unknown });

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

  it('should handle chat.message hook', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {
      sessionID: 'chat-session-123',
      agent: 'coder',
      model: { providerID: 'anthropic', modelID: 'claude-3-5-sonnet' },
      messageID: 'msg-456',
    };
    const output = { message: {}, parts: [] };

    await plugin['chat.message'](input, output);

    expect(mockSaveToFile).toHaveBeenCalled();
  });

  it('should handle chat.params hook', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {
      sessionID: 'params-session-123',
      agent: 'coder',
      model: { providerID: 'anthropic', modelID: 'claude-3-5-sonnet' },
      provider: { source: 'config', info: {} },
      message: {},
    };
    const output = { temperature: 1.0, topP: 0.9, topK: 40, options: {} };

    await plugin['chat.params'](input, output);

    expect(mockSaveToFile).toHaveBeenCalled();
  });

  it('should handle chat.headers hook', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {
      sessionID: 'headers-session-123',
      agent: 'coder',
      model: { providerID: 'anthropic', modelID: 'claude-3-5-sonnet' },
      provider: { source: 'config', info: {} },
      message: {},
    };
    const output = { headers: {} };

    await plugin['chat.headers'](input, output);

    expect(mockSaveToFile).toHaveBeenCalled();
  });

  it('should handle permission.ask hook', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { sessionID: 'perm-session-123', tool: 'shell' };
    const output = { status: 'ask' as const };

    await plugin['permission.ask'](input, output);

    expect(mockSaveToFile).toHaveBeenCalled();
  });

  it('should handle command.execute.before hook', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {
      command: 'npm test',
      sessionID: 'cmd-session-123',
      arguments: '',
    };
    const output = { parts: [] };

    await plugin['command.execute.before'](input, output);

    expect(mockSaveToFile).toHaveBeenCalled();
  });

  it('should handle experimental.chat.messages.transform hook', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {};
    const output = { messages: [] };

    await plugin['experimental.chat.messages.transform'](input, output);

    expect(mockSaveToFile).toHaveBeenCalled();
  });

  it('should handle experimental.chat.system.transform hook', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {
      sessionID: 'system-session-123',
      model: { modelID: 'claude' },
    };
    const output = { system: [] };

    await plugin['experimental.chat.system.transform'](input, output);

    expect(mockSaveToFile).toHaveBeenCalled();
  });

  it('should handle experimental.session.compacting hook', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { sessionID: 'compacting-session-123' };
    const output = { context: [] };

    await plugin['experimental.session.compacting'](input, output);

    expect(mockSaveToFile).toHaveBeenCalled();
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

    await plugin['experimental.text.complete'](input, output);

    expect(mockSaveToFile).toHaveBeenCalled();
  });

  it('should handle tool.definition hook', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { toolID: 'custom-tool' };
    const output = { description: 'Custom tool', parameters: {} };

    await plugin['tool.definition'](input, output);

    expect(mockSaveToFile).toHaveBeenCalled();
  });

  it('should handle config hook', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { model: { providerID: 'anthropic' } };

    await plugin.config(input);

    expect(mockSaveToFile).toHaveBeenCalled();
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
        saveToFile: true,
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
    } as unknown);

    expect(plugin).toEqual({});
  });
});
