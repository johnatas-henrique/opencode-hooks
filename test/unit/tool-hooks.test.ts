import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';
import type {
  PluginInput,
  PluginClient,
  PluginDollar,
} from '../__mocks__/@opencode-ai/plugin';

const { mockRunScript } = vi.hoisted(() => ({
  mockRunScript: vi.fn(),
}));

const { mockSaveToFile } = vi.hoisted(() => ({
  mockSaveToFile: vi.fn().mockResolvedValue(undefined),
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
  const actual = await vi.importActual('../../.opencode/plugins/config');
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

vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: mockSaveToFile,
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

import { _runScript } from '../../.opencode/plugins/features/scripts/run-script';
import { _saveToFile } from '../../.opencode/plugins/features/persistence/save-to-file';

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

  it('should trigger toast when tool is read', async () => {
    const ctx = createMockCtx(mockClient, mockDollar) as unknown;
    const plugin = await OpencodeHooks(ctx);
    const input = {
      tool: 'read',
      sessionID: 'session-123',
      callID: 'call-1',
    };
    const output = {};
    await plugin['tool.execute.before'](input, output);

    expect(globalMockQueue.add).toHaveBeenCalled();
    const callArgs = globalMockQueue.add.mock.calls[0][0] as {
      title: string;
      variant: string;
    };
    expect(callArgs.variant).toBe('warning');
    expect(callArgs.title).toBe('====READ BEFORE====');
  });

  it('should not trigger toast when tool is write', async () => {
    const ctx = createMockCtx(mockClient, mockDollar) as unknown;
    const plugin = await OpencodeHooks(ctx);
    const input = {
      tool: 'write',
      sessionID: 'session-123',
      callID: 'call-2',
    };
    const output = {};
    await plugin['tool.execute.before'](input, output);

    expect(globalMockQueue.add).not.toHaveBeenCalled();
  });

  it('should run script for read tool', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { tool: 'read', sessionID: 'session-123' };
    const output = {};
    await plugin['tool.execute.before'](input, output);

    expect(mockRunScript).toHaveBeenCalledWith(
      mockDollar,
      'tool-execute-before-read.sh',
      'read'
    );
  });

  it('should not run script when tool is disabled', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { tool: 'disabled', sessionID: 'session-123' };
    const output = {};
    await plugin['tool.execute.before'](input, output);

    expect(mockRunScript).not.toHaveBeenCalled();
    expect(globalMockQueue.add).not.toHaveBeenCalled();
  });

  it('should show error toast when script fails', async () => {
    mockRunScript.mockResolvedValueOnce({
      output: '',
      error: 'Script not found',
      exitCode: -1,
    });

    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { tool: 'read', sessionID: 'session-123' };
    const output = {};
    await plugin['tool.execute.before'](input, output);

    const errorToastCall = globalMockQueue.add.mock.calls.find(
      (call: [unknown]) => (call[0] as { variant: string }).variant === 'error'
    );

    expect(errorToastCall).toBeDefined();
    expect(errorToastCall[0].title).toMatch(/ - SCRIPT ERROR====$/);
    expect(errorToastCall[0].message).toContain('tool-execute-before-read.sh');
  });

  it('should save error to file when script fails', async () => {
    mockRunScript.mockResolvedValueOnce({
      output: '',
      error: 'Script not found',
      exitCode: -1,
    });

    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { tool: 'read', sessionID: 'session-123' };
    const output = {};
    await plugin['tool.execute.before'](input, output);

    expect(mockSaveToFile).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('"error":"Script not found"'),
      })
    );
  });
});

describe('shell.env hook', () => {
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

  it('should run scripts when enabled', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { cwd: '/test/dir' };
    const output = { env: {} };
    await plugin['shell.env'](input, output);

    expect(mockRunScript).toHaveBeenCalledWith(mockDollar, 'shell-env.sh');
  });

  it('should show error toast when script fails', async () => {
    mockRunScript.mockResolvedValueOnce({
      output: '',
      error: 'Env script failed',
      exitCode: -1,
    });

    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { cwd: '/test/dir' };
    const output = { env: {} };
    await plugin['shell.env'](input, output);

    const errorToastCall = globalMockQueue.add.mock.calls.find(
      (call: [unknown]) => (call[0] as { variant: string }).variant === 'error'
    );

    expect(errorToastCall).toBeDefined();
    expect(errorToastCall[0].title).toMatch(/ - SCRIPT ERROR====$/);
    expect(errorToastCall[0].message).toContain('shell-env.sh');
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

  it('should not trigger toast for non-task tools', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = {
      tool: 'read',
      sessionID: 'session-123',
      callID: 'call-456',
      args: {},
    };
    const output = {
      title: 'Read completed',
      output: 'result',
      metadata: {},
    };
    await plugin['tool.execute.after'](input, output);

    expect(globalMockQueue.add).toHaveBeenCalled();
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
    await plugin['tool.execute.after'](input, output);

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
    await plugin['tool.execute.after'](input, output);

    const errorToastCall = globalMockQueue.add.mock.calls.find(
      (call: [unknown]) => (call[0] as { variant: string }).variant === 'error'
    );

    expect(errorToastCall).toBeDefined();
    expect(errorToastCall[0].title).toMatch(/ - SCRIPT ERROR====$/);
    expect(errorToastCall[0].message).toContain('Error: Agent script failed');
  });
});
