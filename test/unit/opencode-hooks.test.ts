import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';

const mockRunScript = jest.fn().mockResolvedValue('Script executed');

const createMockCtx = (client: any, dollar: any) => ({
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
    .mockImplementation((...args: any[]) => mockRunScript(...args)),
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
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.info.id}\nTime: now`,
    },
    'tool.execute.before': {
      title: '====TOOL EXECUTE BEFORE====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-before.sh',
      buildMessage: (event: any) =>
        `Tool: ${event.properties?.tool || 'unknown'}\nTime: now`,
    },
    'tool.execute.after': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-after.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties?.sessionID || 'unknown'}\nTime: now`,
    },
    'tool.execute.after.subagent': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'log-agent.sh',
      buildMessage: (event: any) =>
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

jest.mock('../../.opencode/plugins/helpers/user-events.config', () => ({
  userConfig: {
    enabled: true,
    toast: true,
    saveToFile: true,
    appendToSession: true,
    runScripts: true,
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
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.info.id}\nTime: now`,
    },
    'tool.execute.before': {
      title: '====TOOL EXECUTE BEFORE====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-before.sh',
      buildMessage: (event: any) =>
        `Tool: ${event.properties?.tool || 'unknown'}\nTime: now`,
    },
    'tool.execute.after': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-after.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties?.sessionID || 'unknown'}\nTime: now`,
    },
    'tool.execute.after.subagent': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'log-agent.sh',
      buildMessage: (event: any) =>
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
  };

  const mockUserConfig = {
    enabled: true,
    toast: true,
    saveToFile: true,
    appendToSession: true,
    runScripts: true,
    events: {
      'session.created': true,
      'shell.env': { runScripts: true, scripts: ['shell-env.sh'] },
      'session.disabled': false,
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
    const userEventConfig = (mockUserConfig as any).events[eventType];
    const global = mockUserConfig;

    if (!global.enabled) {
      return { enabled: false } as any;
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
      };
    }

    if (userEventConfig === false) {
      return { enabled: false } as any;
    }

    const cfg = userEventConfig as any;

    let scripts: string[] = [];
    if (cfg.runScripts === false) {
      scripts = [];
    } else if (cfg.scripts !== undefined) {
      scripts = cfg.scripts;
    } else if (cfg.runScripts === true || global.runScripts) {
      scripts = [handler?.defaultScript ?? 'default.sh'];
    }

    const toastCfg = typeof cfg.toast === 'object' ? cfg.toast : null;

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
    };
  }

  function resolveToolConfig(toolEventType: string, toolName: string) {
    const toolConfigs = (mockUserConfig as any).tools?.[toolEventType];
    const toolConfig = toolConfigs?.[toolName];

    if (toolConfig === false) {
      return { enabled: false } as any;
    }

    if (!toolConfig) {
      return resolveEventConfig(toolEventType);
    }

    const handler = mockHandlers[toolEventType];
    const global = mockUserConfig;

    const cfg = toolConfig as any;

    let scripts: string[] = [];
    if (cfg.runScripts === false) {
      scripts = [];
    } else if (cfg.scripts !== undefined) {
      scripts = cfg.scripts;
    } else if (cfg.runScripts === true || global.runScripts) {
      scripts = [handler?.defaultScript ?? 'default.sh'];
    }

    const toastCfg = typeof cfg.toast === 'object' ? cfg.toast : null;

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
    };
  }

  return {
    resolveEventConfig: jest.fn(resolveEventConfig),
    resolveToolConfig: jest.fn(resolveToolConfig),
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

describe('opencode-hooks - plugin hooks', () => {
  let mockClient: MockClient;
  let mockDollar: any;

  beforeEach(() => {
    mockClient = createMockClient();
    mockDollar = jest.fn().mockResolvedValue({
      exitCode: 0,
      stdout: '',
      stderr: '',
    });
    jest.clearAllMocks();
    mockRunScript.mockResolvedValue('Script executed');
  });

  describe('disabled plugin', () => {
    it('should return empty object when plugin is disabled', async () => {
      jest.resetModules();
      jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
        userConfig: {
          enabled: false,
          toast: true,
          saveToFile: true,
          appendToSession: true,
          runScripts: true,
          events: {},
          tools: {},
        },
      }));

      const { OpencodeHooks: DisabledHooks } =
        await import('../../.opencode/plugins/opencode-hooks');
      const plugin = await DisabledHooks({
        client: mockClient,
        $: mockDollar,
      } as any);

      expect(plugin).toEqual({});
    });
  });

  describe('tool.execute.before', () => {
    it('should trigger toast when tool is read', async () => {
      const ctx = createMockCtx(mockClient, mockDollar) as any;
      const plugin = await OpencodeHooks(ctx);
      const input = {
        tool: 'read',
        sessionID: 'session-123',
        callID: 'call-1',
      };
      const output = {};
      await plugin['tool.execute.before'](input, output);

      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.variant).toBe('info');
      expect(callArgs.body.title).toBe('====TOOL EXECUTE BEFORE====');
    });

    it('should not trigger toast when tool is write', async () => {
      const ctx = createMockCtx(mockClient, mockDollar) as any;
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
      mockRunScript.mockRejectedValueOnce(new Error('Script not found'));

      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const input = { tool: 'read', sessionID: 'session-123' };
      const output = {};
      await plugin['tool.execute.before'](input, output);

      const errorToastCall = mockClient.tui.showToast.mock.calls.find(
        (call: any) => call[0].body.variant === 'error'
      );

      expect(errorToastCall).toBeDefined();
      expect(errorToastCall[0].body.title).toBe('====SCRIPT ERROR====');
      expect(errorToastCall[0].body.message).toContain('before-read.sh');
    });

    it('should save error to file when script fails', async () => {
      mockRunScript.mockRejectedValueOnce(new Error('Script not found'));

      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const input = { tool: 'read', sessionID: 'session-123' };
      const output = {};
      await plugin['tool.execute.before'](input, output);

      expect(saveToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('"errorMessage":"Script not found"'),
        })
      );
    });
  });

  describe('shell.env', () => {
    it('should run scripts when enabled', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const input = { cwd: '/test/dir' };
      const output = { env: {} };
      await plugin['shell.env'](input, output);

      expect(runScript).toHaveBeenCalledWith(mockDollar, 'shell-env.sh');
    });

    it('should show error toast when script fails', async () => {
      mockRunScript.mockRejectedValueOnce(new Error('Env script failed'));

      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const input = { cwd: '/test/dir' };
      const output = { env: {} };
      await plugin['shell.env'](input, output);

      const errorToastCall = mockClient.tui.showToast.mock.calls.find(
        (call: any) => call[0].body.variant === 'error'
      );

      expect(errorToastCall).toBeDefined();
      expect(errorToastCall[0].body.title).toBe('====SCRIPT ERROR====');
      expect(errorToastCall[0].body.message).toContain('shell-env.sh');
    });
  });

  describe('tool.execute.after', () => {
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

      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
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

      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
    });

    it('should show error toast when script fails', async () => {
      mockRunScript.mockRejectedValueOnce(new Error('Agent script failed'));

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
        (call: any) => call[0].body.variant === 'error'
      );

      expect(errorToastCall).toBeDefined();
      expect(errorToastCall[0].body.title).toBe('====SCRIPT ERROR====');
      expect(errorToastCall[0].body.message).toContain(
        'Error: Agent script failed'
      );
    });
  });

  describe('event handler', () => {
    it('should return early when no handler exists for event type', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'unknown.event',
        properties: { sessionID: 'test-123' },
      };
      await plugin.event({ event });

      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
    });

    it('should skip script for subagent sessions when runOnlyOnce is true', async () => {
      jest.resetModules();
      jest.unmock('../../.opencode/plugins/helpers/user-events.config');
      jest.unmock('../../.opencode/plugins/helpers/run-script');
      jest.unmock('../../.opencode/plugins/helpers/save-to-file');
      jest.unmock('../../.opencode/plugins/helpers/append-to-session');
      jest.unmock('../../.opencode/plugins/helpers/default-handlers');
      jest.unmock('../../.opencode/plugins/helpers/events');

      jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
        userConfig: {
          enabled: true,
          toast: true,
          saveToFile: true,
          appendToSession: true,
          events: {
            'session.created': { runScripts: true, runOnlyOnce: true },
          },
          tools: {},
        },
      }));

      const mockRunScriptFn = jest.fn().mockResolvedValue('Script executed');
      jest.doMock('../../.opencode/plugins/helpers/run-script', () => ({
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
      jest.resetModules();
      jest.unmock('../../.opencode/plugins/helpers/user-events.config');
      jest.unmock('../../.opencode/plugins/helpers/run-script');
      jest.unmock('../../.opencode/plugins/helpers/save-to-file');
      jest.unmock('../../.opencode/plugins/helpers/append-to-session');
      jest.unmock('../../.opencode/plugins/helpers/default-handlers');
      jest.unmock('../../.opencode/plugins/helpers/events');

      jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
        userConfig: {
          enabled: true,
          toast: true,
          saveToFile: true,
          appendToSession: true,
          events: {
            'session.created': { runScripts: true, runOnlyOnce: true },
          },
          tools: {},
        },
      }));

      const mockRunScriptFn = jest.fn().mockResolvedValue('Script executed');
      jest.doMock('../../.opencode/plugins/helpers/run-script', () => ({
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
      jest.resetModules();
      jest.unmock('../../.opencode/plugins/helpers/user-events.config');
      jest.unmock('../../.opencode/plugins/helpers/run-script');
      jest.unmock('../../.opencode/plugins/helpers/save-to-file');
      jest.unmock('../../.opencode/plugins/helpers/append-to-session');
      jest.unmock('../../.opencode/plugins/helpers/default-handlers');
      jest.unmock('../../.opencode/plugins/helpers/events');

      jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
        userConfig: {
          enabled: true,
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

      const mockRunScriptFn2 = jest.fn().mockResolvedValue('Script executed');
      jest.doMock('../../.opencode/plugins/helpers/run-script', () => ({
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
        properties: { info: { id: 'session-2', title: 'Subagent' } },
      };
      await plugin.event({ event: event2 });

      expect(mockClient.tui.showToast.mock.calls.length).toBe(
        toastCountAfterFirst + 1
      );
    });
  });

  describe('new hooks - chat.message', () => {
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

      expect(saveToFile).toHaveBeenCalled();
    });
  });

  describe('new hooks - chat.params', () => {
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

      expect(saveToFile).toHaveBeenCalled();
    });
  });

  describe('new hooks - chat.headers', () => {
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

      expect(saveToFile).toHaveBeenCalled();
    });
  });

  describe('new hooks - permission.ask', () => {
    it('should handle permission.ask hook', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const input = { sessionID: 'perm-session-123', tool: 'shell' };
      const output = { status: 'ask' as const };

      await plugin['permission.ask'](input, output);

      expect(saveToFile).toHaveBeenCalled();
    });
  });

  describe('new hooks - command.execute.before', () => {
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

      expect(saveToFile).toHaveBeenCalled();
    });
  });

  describe('new hooks - experimental.chat.messages.transform', () => {
    it('should handle experimental.chat.messages.transform hook', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const input = {};
      const output = { messages: [] };

      await plugin['experimental.chat.messages.transform'](input, output);

      expect(saveToFile).toHaveBeenCalled();
    });
  });

  describe('new hooks - experimental.chat.system.transform', () => {
    it('should handle experimental.chat.system.transform hook', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const input = {
        sessionID: 'system-session-123',
        model: { modelID: 'claude' },
      };
      const output = { system: [] };

      await plugin['experimental.chat.system.transform'](input, output);

      expect(saveToFile).toHaveBeenCalled();
    });
  });

  describe('new hooks - experimental.session.compacting', () => {
    it('should handle experimental.session.compacting hook', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const input = { sessionID: 'compacting-session-123' };
      const output = { context: [] };

      await plugin['experimental.session.compacting'](input, output);

      expect(saveToFile).toHaveBeenCalled();
    });
  });

  describe('new hooks - experimental.text.complete', () => {
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

      expect(saveToFile).toHaveBeenCalled();
    });
  });

  describe('new hooks - tool.definition', () => {
    it('should handle tool.definition hook', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const input = { toolID: 'custom-tool' };
      const output = { description: 'Custom tool', parameters: {} };

      await plugin['tool.definition'](input, output);

      expect(saveToFile).toHaveBeenCalled();
    });
  });

  describe('new hooks - config', () => {
    it('should handle config hook', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const input = { model: { providerID: 'anthropic' } };

      await plugin.config(input);

      expect(saveToFile).toHaveBeenCalled();
    });
  });

  describe('executeHook - debug mode', () => {
    it('should call handleDebugLog when debug is enabled in executeHook', async () => {
      jest.resetModules();
      jest.unmock('../../.opencode/plugins/helpers/user-events.config');
      jest.unmock('../../.opencode/plugins/helpers/default-handlers');
      jest.unmock('../../.opencode/plugins/helpers/events');
      jest.unmock('../../.opencode/plugins/helpers/debug');

      jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
        userConfig: {
          enabled: true,
          events: {
            'shell.env': { debug: true, runScripts: false },
          },
          tools: {},
        },
      }));

      jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
        handlers: {
          'shell.env': {
            title: '====SHELL ENV====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'shell-env.sh',
            buildMessage: () => 'shell env',
          },
        },
      }));

      const mockHandleDebugLog = jest.fn().mockResolvedValue(undefined);
      jest.doMock('../../.opencode/plugins/helpers/debug', () => ({
        handleDebugLog: mockHandleDebugLog,
      }));

      const { OpencodeHooks: DebugPlugin } =
        await import('../../.opencode/plugins/opencode-hooks');
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await DebugPlugin(ctx);

      const input = { cwd: '/test/dir' };
      const output = { env: {} };
      await plugin['shell.env'](input as any, output as any);

      expect(mockHandleDebugLog).toHaveBeenCalled();
    });

    it('should call handleDebugLog when debug is enabled in event handler', async () => {
      jest.setTimeout(30000);
      jest.resetModules();
      jest.unmock('../../.opencode/plugins/helpers/user-events.config');
      jest.unmock('../../.opencode/plugins/helpers/default-handlers');
      jest.unmock('../../.opencode/plugins/helpers/events');
      jest.unmock('../../.opencode/plugins/helpers/debug');

      jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
        userConfig: {
          enabled: true,
          events: {
            'session.created': { debug: true, runScripts: false },
          },
          tools: {},
        },
      }));

      jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
        handlers: {
          'session.created': {
            title: '====SESSION CREATED====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'session-created.sh',
            buildMessage: () => 'session created',
          },
        },
      }));

      const mockHandleDebugLog = jest.fn().mockResolvedValue(undefined);
      jest.doMock('../../.opencode/plugins/helpers/debug', () => ({
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
      await plugin.event({ event: event as any });

      expect(mockHandleDebugLog).toHaveBeenCalled();
    });
  });

  describe('tool.execute.before - debug mode', () => {
    it('should call handleDebugLog when debug is enabled for tool', async () => {
      jest.setTimeout(30000);
      jest.resetModules();
      jest.unmock('../../.opencode/plugins/helpers/user-events.config');
      jest.unmock('../../.opencode/plugins/helpers/debug');

      jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
        userConfig: {
          enabled: true,
          events: {
            'tool.execute.before': { debug: true, runScripts: false },
          },
          tools: {
            'tool.execute.before': {
              read: { debug: true, runScripts: false },
            },
          },
        },
      }));

      const mockHandleDebugLog = jest.fn().mockResolvedValue(undefined);
      jest.doMock('../../.opencode/plugins/helpers/debug', () => ({
        handleDebugLog: mockHandleDebugLog,
      }));

      const { OpencodeHooks: DebugPlugin } =
        await import('../../.opencode/plugins/opencode-hooks');
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await DebugPlugin(ctx);

      const input = { tool: 'read', sessionID: 'test-session' };
      const output = {};
      await plugin['tool.execute.before'](input as any, output as any);

      expect(mockHandleDebugLog).toHaveBeenCalled();
    });
  });
});
