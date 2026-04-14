import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';
import type {
  PluginInput,
  PluginClient,
  PluginDollar,
} from '../__mocks__/@opencode-ai/plugin';

const mockRunScript = jest
  .fn()
  .mockResolvedValue({ output: 'Script executed', error: null, exitCode: 0 });

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

jest.mock('../../.opencode/plugins/helpers/run-script', () => ({
  runScript: jest
    .fn()
    .mockImplementation((...args: Parameters<typeof mockRunScript>) =>
      mockRunScript(...args)
    ),
}));

jest.mock('../../.opencode/plugins/helpers/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../.opencode/plugins/helpers/debug', () => ({
  handleDebugLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../.opencode/plugins/helpers/append-to-session', () => ({
  appendToSession: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../.opencode/plugins/helpers/default-handlers', () => ({
  handlers: {
    'session.created': {
      title: '====SESSION CREATED====',
      variant: 'success',
      duration: 2000,
      defaultScript: 'session-created.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.info.id}\nTime: now`,
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

jest.mock('../../.opencode/plugins/helpers/config/index', () => ({
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
      outputTitle: 'Script Output',
      errorTitle: 'Script Error',
    },
    events: {
      'session.created': { runOnlyOnce: true },
      'shell.env': { runScripts: true, scripts: ['shell-env.sh'] },
      'chat.message': { enabled: false },
      'chat.params': { enabled: false },
      'chat.headers': { enabled: false },
      'experimental.chat.messages.transform': { enabled: false },
      'experimental.chat.system.transform': { enabled: false },
      'experimental.text.complete': { enabled: false },
      'session.unknown': { enabled: false },
    },
    tools: {
      'tool.execute.after': {
        task: { toast: true, scripts: ['log-agent.sh'] },
        chat: { toast: false },
      },
      'tool.execute.after.subagent': {
        task: { toast: true, scripts: ['log-agent.sh'] },
      },
      'tool.execute.before': {
        read: { toast: true, scripts: ['before-read.sh'] },
        write: { toast: false, scripts: ['before-write.sh'] },
        disabled: false,
      },
    },
  },
}));

jest.mock('../../.opencode/plugins/helpers/events', () => {
  const mockHandlers = {
    'session.created': {
      title: '====SESSION CREATED====',
      variant: 'success',
      duration: 2000,
      defaultScript: 'session-created.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.info.id}\nTime: now`,
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
    'session.idle': {
      title: '====SESSION IDLE====',
      variant: 'info',
      duration: 2000,
      buildMessage: () => 'session idle',
    },
  };

  const mockUserConfig = {
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
      outputTitle: 'Script Output',
      errorTitle: 'Script Error',
    },
    events: {
      'session.created': true,
      'shell.env': { runScripts: true, scripts: ['shell-env.sh'] },
      'session.disabled': false,
      'session.idle': {
        runScripts: true,
        scripts: ['script1.sh', 'script2.sh', 'script3.sh'],
        toast: true,
        toastTitle: 'Scripts Executed',
        scriptToasts: {
          showOutput: true,
          showError: true,
          outputVariant: 'info',
          errorVariant: 'error',
          outputDuration: 5000,
          errorDuration: 15000,
        },
      },
    },
    tools: {
      'tool.execute.after': {
        task: { toast: true, scripts: ['log-agent.sh'] },
        chat: { toast: false },
      },
      'tool.execute.after.subagent': {
        task: { toast: true, scripts: ['log-agent.sh'] },
      },
      'tool.execute.before': {
        read: { toast: true, scripts: ['before-read.sh'] },
        write: { toast: false, scripts: ['before-write.sh'] },
        disabled: false,
      },
    },
  };

  function resolveEventConfig(eventType: string) {
    const handler = mockHandlers[eventType];
    const userEventConfig = mockUserConfig.events[eventType];
    const global = mockUserConfig;

    if (!global.enabled) {
      return { enabled: false };
    }

    if (userEventConfig === undefined) {
      return {
        enabled: true,
        toast: global.toast,
        toastTitle: handler?.title ?? '',
        toastMessage: undefined,
        toastVariant: handler?.variant ?? 'info',
        toastDuration: handler?.duration ?? 2000,
        scripts: global.runScripts
          ? [handler?.defaultScript ?? 'default.sh']
          : [],
        saveToFile: global.saveToFile,
        appendToSession: global.appendToSession,
        scriptToasts: global.scriptToasts,
      };
    }

    if (userEventConfig === false) {
      return { enabled: false } as unknown;
    }

    const cfg = userEventConfig as unknown;

    let scripts: string[] = [];
    if (cfg.runScripts === false) {
      scripts = [];
    } else if (cfg.scripts !== undefined) {
      scripts = cfg.scripts;
    } else if (cfg.runScripts === true || global.runScripts) {
      scripts = [handler?.defaultScript ?? 'default.sh'];
    }

    const toastCfg = typeof cfg.toast === 'object' ? cfg.toast : null;
    const scriptToastsCfg = cfg.scriptToasts ?? global.scriptToasts;

    return {
      enabled: true,
      toast:
        cfg.toast !== undefined
          ? typeof cfg.toast === 'boolean'
            ? cfg.toast
            : true
          : global.toast,
      toastTitle: toastCfg?.title ?? handler?.title ?? '',
      toastMessage: toastCfg?.message,
      toastVariant: toastCfg?.variant ?? handler?.variant ?? 'info',
      toastDuration: toastCfg?.duration ?? handler?.duration ?? 2000,
      scripts,
      saveToFile: cfg.saveToFile ?? global.saveToFile,
      appendToSession: cfg.appendToSession ?? global.appendToSession,
      scriptToasts: scriptToastsCfg,
    };
  }

  function resolveToolConfig(toolEventType: string, toolName: string) {
    const toolConfigs = (mockUserConfig as unknown).tools?.[toolEventType];
    const toolConfig = toolConfigs?.[toolName];

    if (toolConfig === false) {
      return { enabled: false } as unknown;
    }

    if (!toolConfig) {
      return resolveEventConfig(toolEventType);
    }

    const handler = mockHandlers[toolEventType];
    const global = mockUserConfig;

    const cfg = toolConfig as unknown;

    let scripts: string[] = [];
    if (cfg.runScripts === false) {
      scripts = [];
    } else if (cfg.scripts !== undefined) {
      scripts = cfg.scripts;
    } else if (cfg.runScripts === true || global.runScripts) {
      scripts = [handler?.defaultScript ?? 'default.sh'];
    }

    const toastCfg = typeof cfg.toast === 'object' ? cfg.toast : null;
    const scriptToastsCfg = cfg.scriptToasts ?? global.scriptToasts;

    return {
      enabled: true,
      toast:
        cfg.toast !== undefined
          ? typeof cfg.toast === 'boolean'
            ? cfg.toast
            : true
          : global.toast,
      toastTitle: toastCfg?.title ?? handler?.title ?? '',
      toastMessage: toastCfg?.message,
      toastVariant: toastCfg?.variant ?? handler?.variant ?? 'info',
      toastDuration: toastCfg?.duration ?? handler?.duration ?? 2000,
      scripts,
      saveToFile: cfg.saveToFile ?? global.saveToFile,
      appendToSession: cfg.appendToSession ?? global.appendToSession,
      scriptToasts: scriptToastsCfg,
    };
  }

  return {
    resolveEventConfig: jest.fn(resolveEventConfig),
    resolveToolConfig: jest.fn(resolveToolConfig),
    normalizeInputForHandler: jest.fn(
      (
        eventType: string,
        input: Record<string, unknown>,
        output?: Record<string, unknown>
      ) => {
        if (eventType.startsWith('tool.execute.')) {
          return { input, output };
        }
        if (input.properties && typeof input.properties === 'object') {
          return { properties: input.properties, output };
        }
        return { properties: input, output };
      }
    ),
    getHandler: jest.fn((eventType: string) => mockHandlers[eventType]),
  };
});

jest.mock('../../.opencode/plugins/helpers/toast-queue', () => {
  const mockQueue = {
    add: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    pending: 0,
  };
  return {
    ...jest.requireActual('../../.opencode/plugins/helpers/toast-queue'),
    initGlobalToastQueue: jest.fn((showFn) => {
      mockQueue.add = jest.fn((toast) => showFn(toast));
      return mockQueue;
    }),
    useGlobalToastQueue: jest.fn(() => mockQueue),
    getGlobalToastQueue: jest.fn(() => mockQueue),
    resetGlobalToastQueue: jest.fn(),
  };
});

jest.mock('../../.opencode/plugins/helpers/show-startup-toast', () => ({
  showStartupToast: jest.fn().mockResolvedValue(undefined),
}));

import { runScript } from '../../.opencode/plugins/helpers/run-script';
import { saveToFile } from '../../.opencode/plugins/helpers/save-to-file';

interface MockClient {
  tui: {
    showToast: ReturnType<typeof jest.fn>;
  };
  session: {
    prompt: ReturnType<typeof jest.fn>;
  };
}

const createMockClient = (): MockClient => ({
  tui: {
    showToast: jest.fn().mockResolvedValue(undefined),
  },
  session: {
    prompt: jest.fn().mockResolvedValue(undefined),
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
    mockDollar = jest
      .fn<() => Promise<{ exitCode: number; stdout: string; stderr: string }>>()
      .mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    jest.clearAllMocks();
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

    expect(mockClient.tui.showToast).toHaveBeenCalledTimes(2);
    const callArgs = mockClient.tui.showToast.mock.calls[0][0];
    expect(callArgs.body.variant).toBe('info');
    expect(callArgs.body.title).toBe('====TOOL EXECUTE BEFORE====');
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

    expect(mockClient.tui.showToast).not.toHaveBeenCalled();
  });

  it('should run script for read tool', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { tool: 'read', sessionID: 'session-123' };
    const output = {};
    await plugin['tool.execute.before'](input, output);

    expect(runScript).toHaveBeenCalledWith(
      mockDollar,
      'before-read.sh',
      'read'
    );
  });

  it('should not run script when tool is disabled', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const input = { tool: 'disabled', sessionID: 'session-123' };
    const output = {};
    await plugin['tool.execute.before'](input, output);

    expect(runScript).not.toHaveBeenCalled();
    expect(mockClient.tui.showToast).not.toHaveBeenCalled();
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

    const errorToastCall = mockClient.tui.showToast.mock.calls.find(
      (call: [unknown]) =>
        (call[0] as { body: { variant: string } }).body.variant === 'error'
    );

    expect(errorToastCall).toBeDefined();
    expect(errorToastCall[0].body.title).toMatch(/ Script Error====$/);
    expect(errorToastCall[0].body.message).toContain('before-read.sh');
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

    expect(saveToFile).toHaveBeenCalledWith(
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
    mockDollar = jest
      .fn<() => Promise<{ exitCode: number; stdout: string; stderr: string }>>()
      .mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    jest.clearAllMocks();
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

    expect(runScript).toHaveBeenCalledWith(mockDollar, 'shell-env.sh');
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

    const errorToastCall = mockClient.tui.showToast.mock.calls.find(
      (call: [unknown]) =>
        (call[0] as { body: { variant: string } }).body.variant === 'error'
    );

    expect(errorToastCall).toBeDefined();
    expect(errorToastCall[0].body.title).toMatch(/ Script Error====$/);
    expect(errorToastCall[0].body.message).toContain('shell-env.sh');
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
    mockDollar = jest
      .fn<() => Promise<{ exitCode: number; stdout: string; stderr: string }>>()
      .mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    jest.clearAllMocks();
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

    expect(mockClient.tui.showToast).toHaveBeenCalledTimes(2);
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

    expect(mockClient.tui.showToast).toHaveBeenCalledTimes(2);
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

    const errorToastCall = mockClient.tui.showToast.mock.calls.find(
      (call: [unknown]) =>
        (call[0] as { body: { variant: string } }).body.variant === 'error'
    );

    expect(errorToastCall).toBeDefined();
    expect(errorToastCall[0].body.title).toMatch(/ Script Error====$/);
    expect(errorToastCall[0].body.message).toContain(
      'Error: Agent script failed'
    );
  });
});
