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

jest.mock('../.opencode/plugins/helpers/user-events.config', () => ({
  userConfig: {
    enabled: true,
    toast: true,
    saveToFile: true,
    appendToSession: true,
    runScripts: true,
    events: {
      'session.created': true,
      'session.compacted': { scripts: ['pre-compact.sh'] },
      'session.deleted': true,
      'session.error': true,
      'session.diff': false,
      'session.idle': false,
      'session.status': { toast: false },
      'session.updated': { toast: false },
      'server.instance.disposed': {
        scripts: ['session-stop.sh'],
        toast: false,
      },
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
        'git.commit': { runScripts: false },
      },
    },
  },
}));

jest.mock('../.opencode/plugins/helpers/default-handlers', () => ({
  handlers: {
    'session.created': {
      title: '====SESSION CREATED====',
      variant: 'success',
      duration: 2000,
      defaultScript: 'session-created.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.info.id}\nTitle: ${event.properties.info.title}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.compacted': {
      title: '====SESSION COMPACTED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-compacted.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.deleted': {
      title: '====SESSION DELETED====',
      variant: 'error',
      duration: 2000,
      defaultScript: 'session-deleted.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.info.id}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.error': {
      title: '====SESSION ERROR====',
      variant: 'error',
      duration: 30000,
      defaultScript: 'session-error.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nError: ${event.properties.error?.name || 'Unknown error'}\nMessage: ${event.properties.error?.data?.message || 'Unknown message'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.diff': {
      title: '====SESSION DIFF====',
      variant: 'warning',
      duration: 2000,
      defaultScript: 'session-diff.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.idle': {
      title: '====SESSION IDLE====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-idle.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.status': {
      title: '====SESSION STATUS====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-status.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.updated': {
      title: '====SESSION UPDATED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-updated.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'server.instance.disposed': {
      title: '====SERVER STOPPED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-stop.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'tool.execute.after': {
      title: '====TOOL AFTER====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-after.sh',
      buildMessage: (event: any) =>
        `Tool: ${event.properties?.tool || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'tool.execute.after.subagent': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'log-agent.sh',
      buildMessage: (event: any) =>
        `Agent: ${event.properties?.subagentType || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'shell.env': {
      title: '====SHELL ENV====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'shell-env.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties?.sessionID || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
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
        `Session Id: ${event.properties.info.id}\nTitle: ${event.properties.info.title}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.compacted': {
      title: '====SESSION COMPACTED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-compacted.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.deleted': {
      title: '====SESSION DELETED====',
      variant: 'error',
      duration: 2000,
      defaultScript: 'session-deleted.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.info.id}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.error': {
      title: '====SESSION ERROR====',
      variant: 'error',
      duration: 30000,
      defaultScript: 'session-error.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nError: ${event.properties.error?.name || 'Unknown error'}\nMessage: ${event.properties.error?.data?.message || 'Unknown message'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.diff': {
      title: '====SESSION DIFF====',
      variant: 'warning',
      duration: 2000,
      defaultScript: 'session-diff.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.idle': {
      title: '====IDLE SESSION====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-idle.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.status': {
      title: '====SESSION STATUS====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-status.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nStatus: ${JSON.stringify(event.properties.status)}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.updated': {
      title: '====UPDATED SESSION====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-updated.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.info.id}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'server.instance.disposed': {
      title: '',
      variant: 'info',
      duration: 0,
      defaultScript: 'session-stop.sh',
      buildMessage: (event: any) =>
        `Directory: ${event.properties.directory || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'tool.execute.after': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-after.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties?.sessionID || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'tool.execute.after.subagent': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'log-agent.sh',
      buildMessage: (event: any) =>
        `Agent: ${event.properties?.subagentType || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
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
      'session.compacted': { scripts: ['pre-compact.sh'] },
      'session.deleted': true,
      'session.error': true,
      'session.diff': false,
      'session.idle': false,
      'session.status': { toast: false },
      'session.updated': { toast: false },
      'server.instance.disposed': {
        scripts: ['session-stop.sh'],
        toast: false,
      },
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
        'git.commit': { runScripts: false },
      },
      'tool.execute.after.subagent': {
        task: { toast: true, scripts: ['log-agent.sh'] },
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
        toastTitle: handler.title,
        toastMessage: undefined,
        toastVariant: handler.variant,
        toastDuration: handler.duration,
        scripts: global.runScripts ? [handler.defaultScript] : [],
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
      scripts = [handler.defaultScript];
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
      toastTitle: toastCfg?.title ?? handler.title,
      toastMessage: toastCfg?.message,
      toastVariant: toastCfg?.variant ?? handler.variant,
      toastDuration: toastCfg?.duration ?? handler.duration,
      scripts,
      saveToFile: cfg.saveToFile ?? global.saveToFile,
      appendToSession: cfg.appendToSession ?? global.appendToSession,
    };
  }

  function resolveToolConfig(toolEventType: string, toolName: string) {
    const toolConfigs = (mockUserConfig as any).tools?.[toolEventType];
    const toolConfig = toolConfigs?.[toolName];

    if (!toolConfig) {
      return resolveEventConfig(toolEventType);
    }

    const handler = mockHandlers[toolEventType];
    const global = mockUserConfig;

    if (toolConfig === false) {
      return { enabled: false } as any;
    }

    const cfg = toolConfig as any;

    let scripts: string[] = [];
    if (cfg.runScripts === false) {
      scripts = [];
    } else if (cfg.scripts !== undefined) {
      scripts = cfg.scripts;
    } else if (cfg.runScripts === true || global.runScripts) {
      scripts = [handler.defaultScript];
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
      toastTitle: toastCfg?.title ?? handler.title,
      toastMessage: toastCfg?.message,
      toastVariant: toastCfg?.variant ?? handler.variant,
      toastDuration: toastCfg?.duration ?? handler.duration,
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

jest.mock('../.opencode/plugins/helpers/toast-queue', () => {
  const mockQueue = {
    add: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    pending: 0,
  };
  return {
    ...jest.requireActual('../.opencode/plugins/helpers/toast-queue'),
    initGlobalToastQueue: jest.fn((showFn) => {
      mockQueue.add = jest.fn((toast) => showFn(toast));
      return mockQueue;
    }),
    useGlobalToastQueue: jest.fn(() => mockQueue),
    getGlobalToastQueue: jest.fn(() => mockQueue),
    resetGlobalToastQueue: jest.fn(),
  };
});

jest.mock('../.opencode/plugins/helpers/show-startup-toast', () => ({
  showStartupToast: jest.fn().mockResolvedValue(undefined),
}));

import { runScript } from '../.opencode/plugins/helpers/run-script';
import { saveToFile } from '../.opencode/plugins/helpers/save-to-file';

const _LOG_FILE = './session_events.log';

const createMockCtx = (client: any, dollar: any) => ({
  client,
  $: dollar,
  project: 'test-project',
  directory: '/test/dir',
  worktree: '/test/dir',
  serverUrl: 'http://localhost:3000',
});

interface Session {
  id: string;
  projectID: string;
  directory: string;
  title: string;
  version: string;
  time: { created: number; updated: number };
}

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

const createMockSession = (id: string = 'test-session-123'): Session => ({
  id,
  projectID: 'test-project',
  directory: '/test/dir',
  title: 'Test Session',
  version: '1.0.0',
  time: { created: Date.now(), updated: Date.now() },
});

describe('Session Plugins', () => {
  let mockClient: MockClient;
  let mockDollar: any;

  beforeEach(() => {
    mockClient = createMockClient();
    mockDollar = {
      spawn: jest
        .fn()
        .mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
    };
    jest.clearAllMocks();
  });

  describe('session.created', () => {
    it('should trigger toast with variant success', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.created',
        properties: { info: createMockSession('session-123') },
      };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.variant).toBe('success');
      expect(callArgs.body.title).toBe('====SESSION CREATED====');
    });

    it('should contain correct session ID in message', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.created',
        properties: { info: createMockSession('my-session-456') },
      };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain('my-session-456');
    });

    it('should have duration of 2000ms (default SHORT)', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.created',
        properties: { info: createMockSession() },
      };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.duration).toBe(2000);
    });

    it('should call saveToFile with log entry', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.created',
        properties: { info: createMockSession() },
      };
      await plugin.event({ event });
      expect(saveToFile).toHaveBeenCalledTimes(3);
      expect(saveToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringMatching(/session.created/),
        })
      );
    });
  });

  describe('session.compacted', () => {
    it('should trigger toast with variant info', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.compacted',
        properties: { sessionID: 'session-123' },
      };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.variant).toBe('info');
      expect(callArgs.body.title).toBe('====SESSION COMPACTED====');
    });

    it('should run pre-compact.sh script', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.compacted',
        properties: { sessionID: 'session-123' },
      };
      await plugin.event({ event });
      expect(runScript).toHaveBeenCalledTimes(1);
      expect(runScript).toHaveBeenCalledWith(mockDollar, 'pre-compact.sh');
    });

    it('should contain session ID in message', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.compacted',
        properties: { sessionID: 'compact-session-789' },
      };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain('compact-session-789');
    });
  });

  describe('session.deleted', () => {
    it('should trigger toast with variant error', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.deleted',
        properties: { info: createMockSession('delete-session-001') },
      };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.variant).toBe('error');
      expect(callArgs.body.title).toBe('====SESSION DELETED====');
    });

    it('should contain correct session ID', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.deleted',
        properties: { info: createMockSession('deleted-id-999') },
      };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain('deleted-id-999');
    });
  });

  describe('session.idle', () => {
    it('should not trigger toast when disabled in config', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.idle',
        properties: { sessionID: 'idle-session-001' },
      };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });
  });

  describe('session.error', () => {
    it('should trigger toast with variant error', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.error',
        properties: {
          sessionID: 'error-session-001',
          error: { name: 'ApiError', data: { message: 'Test error' } },
        },
      };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.variant).toBe('error');
      expect(callArgs.body.title).toBe('====SESSION ERROR====');
    });

    it('should extract error name correctly', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.error',
        properties: {
          sessionID: 'error-session-001',
          error: {
            name: 'ProviderAuthError',
            data: { message: 'Auth failed' },
          },
        },
      };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain('ProviderAuthError');
    });

    it('should extract error message correctly', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.error',
        properties: {
          sessionID: 'error-session-001',
          error: {
            name: 'ApiError',
            data: { message: 'Specific error message' },
          },
        },
      };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain('Specific error message');
    });

    it('should show Unknown error fallback when error is undefined', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.error',
        properties: { sessionID: 'error-session-001', error: undefined },
      };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain('Unknown error');
      expect(callArgs.body.message).toContain('Unknown message');
    });

    it('should show Unknown message fallback when data is missing', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.error',
        properties: {
          sessionID: 'error-session-001',
          error: { name: 'SomeError' } as any,
        },
      };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain('Unknown message');
    });
  });

  describe('session.diff', () => {
    it('should not trigger toast when disabled in config', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.diff',
        properties: { sessionID: 'diff-session-001', diff: [] },
      };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });
  });

  describe('session.status', () => {
    it('should not trigger toast', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.status',
        properties: {
          sessionID: 'status-session-001',
          status: { type: 'idle' },
        },
      };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });

    it('should complete without error', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.status',
        properties: {
          sessionID: 'status-session-001',
          status: { type: 'idle' },
        },
      };
      await expect(plugin.event({ event })).resolves.not.toThrow();
    });
  });

  describe('session.updated', () => {
    it('should not trigger toast', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.updated',
        properties: { info: createMockSession('updated-session-001') },
      };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });

    it('should complete without error', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.updated',
        properties: { info: createMockSession('updated-session-001') },
      };
      await expect(plugin.event({ event })).resolves.not.toThrow();
    });
  });

  describe('server.instance.disposed', () => {
    it('should run session-stop.sh script', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'server.instance.disposed',
        properties: { directory: '/test/dir' },
      };
      await plugin.event({ event });
      expect(runScript).toHaveBeenCalledTimes(1);
      expect(runScript).toHaveBeenCalledWith(mockDollar, 'session-stop.sh');
    });

    it('should not trigger toast', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'server.instance.disposed',
        properties: { directory: '/test/dir' },
      };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });
  });

  describe('tool.execute.after handler', () => {
    it('should trigger toast when tool is task', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const input = {
        tool: 'task',
        sessionID: 'session-123',
        callID: 'call-456',
        args: { subagent_type: 'explore' },
      };
      const output = {
        title: 'Task completed',
        output: 'result',
        metadata: {},
      };
      await plugin['tool.execute.after'](input, output);
      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(2);
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
      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveToFile', () => {
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
      expect(saveToFile).toHaveBeenCalledTimes(15);
    });
  });

  describe('script error handling', () => {
    it('should show error toast when script fails', async () => {
      mockRunScript.mockRejectedValueOnce(new Error('Script not found'));

      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.created',
        properties: { info: createMockSession('error-test-123') },
      };
      await plugin.event({ event });

      const errorToastCall = mockClient.tui.showToast.mock.calls.find(
        (call: any) => call[0].body.variant === 'error'
      );

      expect(errorToastCall).toBeDefined();
      expect(errorToastCall[0].body.title).toBe('====SCRIPT ERROR====');
      expect(errorToastCall[0].body.message).toContain('Script not found');
      expect(errorToastCall[0].body.message).toContain(
        'Check user-events.config.ts'
      );
    });

    it('should save error to file when script fails', async () => {
      mockRunScript.mockRejectedValueOnce(new Error('Script not found'));

      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);
      const event = {
        type: 'session.created',
        properties: { info: createMockSession('error-test-456') },
      };
      await plugin.event({ event });

      expect(saveToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringMatching(/Script error:.*Script not found/),
        })
      );
    });

    it('should show error toast for tool.execute.after script failure', async () => {
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
      expect(errorToastCall[0].body.message).toContain('Agent script failed');
    });
  });
});
