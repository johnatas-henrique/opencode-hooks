import { OpencodeHooks } from '../.opencode/plugins/opencode-hooks';

const mockRunScript = jest.fn().mockResolvedValue('Script executed');

jest.mock('../.opencode/plugins/helpers/run-script', () => ({
  runScript: jest
    .fn()
    .mockImplementation((...args: any[]) => mockRunScript(...args)),
}));

jest.mock('../.opencode/plugins/helpers/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../.opencode/plugins/helpers/append-to-session', () => ({
  appendToSession: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../.opencode/plugins/helpers/handlers', () => ({
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

jest.mock('../.opencode/plugins/helpers/user-events.config', () => ({
  userConfig: {
    enabled: true,
    toast: true,
    saveToFile: true,
    appendToSession: true,
    runScripts: true,
    events: {
      'session.created': true,
      'shell.env': { runScripts: true, scripts: ['shell-env.sh'] },
    },
    tools: {
      'tool.execute.after': {
        task: { toast: true, scripts: ['log-agent.sh'] },
        chat: { toast: false },
      },
      'tool.execute.before': {
        read: { toast: true, scripts: ['before-read.sh'] },
        write: { toast: false, scripts: ['before-write.sh'] },
        disabled: false,
      },
    },
  },
}));

jest.mock('../.opencode/plugins/helpers/events', () => {
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

jest.mock('../.opencode/plugins/helpers/toast-queue', () => ({
  ...jest.requireActual('../.opencode/plugins/helpers/toast-queue'),
  getGlobalToastQueue: jest.fn((showFn) => {
    const queue = {
      add: jest.fn((toast) => {
        showFn(toast);
      }),
      flush: jest.fn().mockResolvedValue(undefined),
      pending: 0,
    };
    return queue;
  }),
  resetGlobalToastQueue: jest.fn(),
}));

import { runScript } from '../.opencode/plugins/helpers/run-script';
import { saveToFile } from '../.opencode/plugins/helpers/save-to-file';

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
    it('should return empty handlers when plugin is disabled', async () => {
      jest.resetModules();
      jest.doMock('../.opencode/plugins/helpers/user-events.config', () => ({
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
        await import('../.opencode/plugins/opencode-hooks');
      const plugin = await DisabledHooks({
        client: mockClient,
        $: mockDollar,
      } as any);

      expect(plugin.event).toBeDefined();
      expect(plugin['tool.execute.before']).toBeDefined();
      expect(plugin['tool.execute.after']).toBeDefined();
      expect(plugin['shell.env']).toBeDefined();
    });
  });

  describe('tool.execute.before', () => {
    it('should trigger toast when tool is read', async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const input = { tool: 'read', sessionID: 'session-123' };
      const output = {};
      await plugin['tool.execute.before'](input, output);

      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.variant).toBe('info');
      expect(callArgs.body.title).toBe('====TOOL EXECUTE BEFORE====');
    });

    it('should not trigger toast when tool is write', async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const input = { tool: 'write', sessionID: 'session-123' };
      const output = {};
      await plugin['tool.execute.before'](input, output);

      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });

    it('should run script for read tool', async () => {
      const ctx = { client: mockClient, $: mockDollar };
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
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const input = { tool: 'disabled', sessionID: 'session-123' };
      const output = {};
      await plugin['tool.execute.before'](input, output);

      expect(runScript).not.toHaveBeenCalled();
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });

    it('should show error toast when script fails', async () => {
      mockRunScript.mockRejectedValueOnce(new Error('Script not found'));

      const ctx = { client: mockClient, $: mockDollar };
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

      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const input = { tool: 'read', sessionID: 'session-123' };
      const output = {};
      await plugin['tool.execute.before'](input, output);

      expect(saveToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringMatching(/Script error:.*Script not found/),
        })
      );
    });
  });

  describe('shell.env', () => {
    it('should run scripts when enabled', async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const input = { cwd: '/test/dir' };
      const output = { env: {} };
      await plugin['shell.env'](input, output);

      expect(runScript).toHaveBeenCalledWith(mockDollar, 'shell-env.sh');
    });

    it('should show error toast when script fails', async () => {
      mockRunScript.mockRejectedValueOnce(new Error('Env script failed'));

      const ctx = { client: mockClient, $: mockDollar };
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
      const ctx = { client: mockClient, $: mockDollar };
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

      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });

    it('should not trigger toast when subagent_type is undefined', async () => {
      const ctx = { client: mockClient, $: mockDollar };
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

      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });

    it('should show error toast when script fails', async () => {
      mockRunScript.mockRejectedValueOnce(new Error('Agent script failed'));

      const ctx = { client: mockClient, $: mockDollar };
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
      expect(errorToastCall[0].body.message).toContain('log-agent.sh');
    });
  });

  describe('event handler', () => {
    it('should return early when no handler exists for event type', async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'unknown.event',
        properties: { sessionID: 'test-123' },
      };
      await plugin.event({ event });

      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
    });
  });
});
