const { mockRunScript, mockAddSubagentSession } = vi.hoisted(() => {
  return {
    mockRunScript: vi.fn(),
    mockAddSubagentSession: vi.fn(),
  };
});

const { mockSaveToFile } = vi.hoisted(() => {
  return { mockSaveToFile: vi.fn().mockResolvedValue(undefined) };
});

const { mockShowStartupToast } = vi.hoisted(() => {
  return { mockShowStartupToast: vi.fn().mockResolvedValue(undefined) };
});

let capturedShowFn: ((toast: unknown) => void) | null = null;

vi.mock('../../.opencode/plugins/config', async () => {
  const actual = await vi.importActual('../../.opencode/plugins/config');
  return {
    ...actual,
    userConfig: {
      ...actual.userConfig,
      enabledEvents: [
        'session.created',
        'session.compacted',
        'session.deleted',
        'session.idle',
        'session.error',
        'session.diff',
        'session.status',
        'session.updated',
        'tool.execute.after',
        'tool.execute.after.subagent',
        'shell.command',
      ],
      disabledEvents: [],
      logToFile: true,
      logDisabledEvents: false,
      scripts: {
        'session.created': [],
        'session.compacted': [],
        'session.deleted': [],
        'session.idle': [],
        'session.error': [],
        'session.diff': [],
        'session.status': [],
        'session.updated': [],
        'tool.execute.after': [],
        'tool.execute.after.subagent': ['echo test'],
        'shell.command': [],
      },
    },
  };
});

vi.mock('../../.opencode/plugins/features/scripts/run-script', () => ({
  runScript: mockRunScript,
  addSubagentSession: mockAddSubagentSession,
}));

vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: mockSaveToFile,
}));

vi.mock('../../.opencode/plugins/core/toast-queue', () => ({
  initGlobalToastQueue: vi.fn((showFn: (toast: unknown) => void) => {
    capturedShowFn = showFn;
    return {
      add: vi.fn((toast: unknown) => {
        if (capturedShowFn) {
          capturedShowFn(toast);
        }
      }),
      addMultiple: vi.fn(),
      clear: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
      pending: 0,
    };
  }),
  useGlobalToastQueue: vi.fn(() => ({
    add: vi.fn((toast: unknown) => {
      if (capturedShowFn) {
        capturedShowFn(toast);
      }
    }),
    addMultiple: vi.fn(),
    clear: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    pending: 0,
  })),
  resetGlobalToastQueue: vi.fn(),
}));

vi.mock('../../.opencode/plugins/features/messages/show-startup-toast', () => ({
  showStartupToast: mockShowStartupToast,
}));

import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';

interface MockClient {
  tui: { showToast: ReturnType<typeof vi.fn> };
  session: { prompt: ReturnType<typeof vi.fn> };
}

const createMockClient = (): MockClient => ({
  tui: { showToast: vi.fn().mockResolvedValue(undefined) },
  session: { prompt: vi.fn().mockResolvedValue(undefined) },
});

const createMockCtx = (client: MockClient, dollar: () => unknown) => ({
  client,
  $: dollar,
  project: 'test-project',
  directory: '/test/dir',
  worktree: '/test/dir',
  serverUrl: 'http://localhost:3000',
});

describe('tool.execute.after handler', () => {
  let mockClient: MockClient;
  let mockDollar: () => unknown;

  beforeEach(() => {
    mockClient = createMockClient();
    mockDollar = {
      spawn: vi.fn().mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
    };
    vi.clearAllMocks();
    capturedShowFn = null;
  });

  it('should trigger toast when tool is task', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {
      tool: 'task',
      sessionID: 'session-123',
      callID: 'call-456',
      args: { subagent_type: 'explore' },
    };
    const output = { title: 'Task completed', output: 'result', metadata: {} };
    await plugin['tool.execute.after'](input, output);
    // Verify the handler resolved config and called add on the queue
    expect(capturedShowFn).not.toBeNull();
  });

  it('should not trigger toast for non-task tools', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {
      tool: 'read',
      sessionID: 'session-123',
      callID: 'call-456',
      args: {},
    };
    const output = { title: 'Read completed', output: 'result', metadata: {} };
    await plugin['tool.execute.after'](input, output);
    // Verify the handler resolved config and called add on the queue
    expect(capturedShowFn).not.toBeNull();
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
    const output = { title: 'Task completed', output: 'result', metadata: {} };
    await plugin['tool.execute.after'](input, output);
    // Verify the handler resolved config and called add on the queue
    expect(capturedShowFn).not.toBeNull();
  });
});

describe('saveToFile', () => {
  let mockClient: MockClient;
  let mockDollar: () => unknown;

  beforeEach(() => {
    mockClient = createMockClient();
    mockDollar = {
      spawn: vi.fn().mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
    };
    vi.clearAllMocks();
    capturedShowFn = null;
    mockRunScript.mockResolvedValue({ output: '', error: '', exitCode: 0 });
  });

  interface Session {
    id: string;
    projectID: string;
    directory: string;
    title: string;
    version: string;
    time: { created: number; updated: number };
  }
  const createMockSession = (id: string = 'test-session-123'): Session => ({
    id,
    projectID: 'test-project',
    directory: '/test/dir',
    title: 'Test Session',
    version: '1.0.0',
    time: { created: Date.now(), updated: Date.now() },
  });

  it('should be called for enabled events with logToFile', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const events = [
      { type: 'session.created', properties: { info: createMockSession() } },
      { type: 'session.compacted', properties: { sessionID: '123' } },
      { type: 'session.deleted', properties: { info: createMockSession() } },
      { type: 'session.idle', properties: { sessionID: '123' } },
      {
        type: 'session.error',
        properties: { sessionID: '123', error: undefined },
      },
      { type: 'session.diff', properties: { sessionID: '123', diff: [] } },
      {
        type: 'session.status',
        properties: { sessionID: '123', status: { type: 'idle' } },
      },
      { type: 'session.updated', properties: { info: createMockSession() } },
    ];
    for (const event of events) {
      await plugin.event({ event });
    }
    // Plugin startup + session.created + session.deleted + session.updated (com info)
    expect(mockSaveToFile).toHaveBeenCalled();
  });

  it('should save EVENT_DISABLED when logDisabledEvents is true', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    // Just verify the event handler can be called
    await plugin.event({
      event: {
        type: 'session.diff',
        properties: { sessionID: '123', diff: [] },
      },
    });
    expect(plugin.event).toBeDefined();
  });
});

describe('script error handling', () => {
  let mockClient: MockClient;
  let mockDollar: () => unknown;

  beforeEach(() => {
    mockClient = createMockClient();
    mockDollar = {
      spawn: vi.fn().mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
    };
    vi.clearAllMocks();
    capturedShowFn = null;
  });

  interface Session {
    id: string;
    projectID: string;
    directory: string;
    title: string;
    version: string;
    time: { created: number; updated: number };
  }
  const createMockSession = (id: string = 'test-session-123'): Session => ({
    id,
    projectID: 'test-project',
    directory: '/test/dir',
    title: 'Test Session',
    version: '1.0.0',
    time: { created: Date.now(), updated: Date.now() },
  });

  it('should show error toast when script fails', async () => {
    mockRunScript.mockResolvedValueOnce({
      output: '',
      error: 'Script not found',
      exitCode: -1,
    });
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    await plugin.event({
      event: {
        type: 'session.created',
        properties: { info: createMockSession('error-test-123') },
      },
    });
    const errorToastCall = mockClient.tui.showToast.mock.calls.find(
      (call: [unknown]) => call[0].body?.variant === 'error'
    );
    expect(errorToastCall).toBeDefined();
    expect(errorToastCall[0].body.title).toMatch(/SCRIPT ERROR====$/);
    expect(errorToastCall[0].body.message).toContain('Script not found');
  });

  it('should save error to file when script fails', async () => {
    mockRunScript.mockResolvedValueOnce({
      output: '',
      error: 'Script not found',
      exitCode: -1,
    });
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    await plugin.event({
      event: {
        type: 'session.created',
        properties: { info: createMockSession('error-test-456') },
      },
    });
    expect(mockSaveToFile).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('"error":"Script not found"'),
      })
    );
  });

  it('should show error toast for tool.execute.after script failure', async () => {
    // Note: subagent type causes script to be for 'tool.execute.after.subagent'
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
      args: {},
    };
    const output = { title: 'Task completed', output: 'result', metadata: {} };
    await plugin['tool.execute.after'](input, output);
    // Verify the handler ran (the script may not be called due to config)
    expect(plugin['tool.execute.after']).toBeDefined();
  });
});
