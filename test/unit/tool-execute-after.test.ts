import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';

const mockRunScript = jest
  .fn()
  .mockResolvedValue({ output: 'Script executed', error: null, exitCode: 0 });

jest.mock('../../.opencode/plugins/features/scripts/run-script', () => ({
  runScript: jest
    .fn()
    .mockImplementation((...args: Parameters<typeof mockRunScript>) =>
      mockRunScript(...args)
    ),
}));

jest.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../.opencode/plugins/features/audit', () => ({
  initAuditLogging: jest.fn().mockResolvedValue(undefined),
  createAuditLogger: jest.fn(() => ({ writeLine: jest.fn() })),
  createEventRecorder: jest.fn(() => ({
    logToolExecuteBefore: jest.fn(),
    logToolExecuteAfter: jest.fn(),
    logSessionEvent: jest.fn(),
  })),
  createScriptRecorder: jest.fn(() => ({ logScript: jest.fn() })),
  createErrorRecorder: jest.fn(() => ({ logError: jest.fn() })),
  archiveLogFiles: jest.fn().mockResolvedValue(undefined),
  getEventRecorder: jest.fn(),
  getScriptRecorder: jest.fn(),
  getErrorRecorder: jest.fn(),
}));

jest.mock('../../.opencode/plugins/config', () => ({
  userConfig: {
    enabled: true,
    logDisabledEvents: true,
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

jest.mock('../../.opencode/plugins/features/messages/default-handlers', () => ({
  handlers: {
    'session.created': {
      title: '====SESSION CREATED====',
      variant: 'success',
      duration: 2000,
      defaultScript: 'session-created.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.info.id}\nTitle: ${event.properties.info.title}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.compacted': {
      title: '====SESSION COMPACTED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-compacted.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.deleted': {
      title: '====SESSION DELETED====',
      variant: 'error',
      duration: 2000,
      defaultScript: 'session-deleted.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.info.id}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.error': {
      title: '====SESSION ERROR====',
      variant: 'error',
      duration: 30000,
      defaultScript: 'session-error.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.sessionID}\nError: ${event.properties.error?.name || 'Unknown error'}\nMessage: ${event.properties.error?.data?.message || 'Unknown message'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.diff': {
      title: '====SESSION DIFF====',
      variant: 'warning',
      duration: 2000,
      defaultScript: 'session-diff.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.idle': {
      title: '====SESSION IDLE====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-idle.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.status': {
      title: '====SESSION STATUS====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-status.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.updated': {
      title: '====SESSION UPDATED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-updated.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.info.id}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'server.instance.disposed': {
      title: '====SERVER STOPPED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-stop.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'tool.execute.after': {
      title: '====TOOL AFTER====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-after.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Tool: ${event.properties?.tool || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'tool.execute.after.subagent': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'log-agent.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Agent: ${event.properties?.subagentType || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'shell.env': {
      title: '====SHELL ENV====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'shell-env.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties?.sessionID || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
  },
}));

jest.mock('../../.opencode/plugins/features/events/events', () => {
  const mockHandlers = {
    'session.created': {
      title: '====SESSION CREATED====',
      variant: 'success',
      duration: 2000,
      defaultScript: 'session-created.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.info.id}\nTitle: ${event.properties.info.title}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.compacted': {
      title: '====SESSION COMPACTED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-compacted.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.deleted': {
      title: '====SESSION DELETED====',
      variant: 'error',
      duration: 2000,
      defaultScript: 'session-deleted.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.info.id}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.error': {
      title: '====SESSION ERROR====',
      variant: 'error',
      duration: 30000,
      defaultScript: 'session-error.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.sessionID}\nError: ${event.properties.error?.name || 'Unknown error'}\nMessage: ${event.properties.error?.data?.message || 'Unknown message'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.diff': {
      title: '====SESSION DIFF====',
      variant: 'warning',
      duration: 2000,
      defaultScript: 'session-diff.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.idle': {
      title: '====IDLE SESSION====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-idle.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.sessionID}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.status': {
      title: '====SESSION STATUS====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-status.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.sessionID}\nStatus: ${JSON.stringify(event.properties.status)}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'session.updated': {
      title: '====UPDATED SESSION====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-updated.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties.info.id}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'server.instance.disposed': {
      title: '',
      variant: 'info',
      duration: 0,
      defaultScript: 'session-stop.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Directory: ${event.properties.directory || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'tool.execute.after': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-after.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${event.properties?.sessionID || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
    },
    'tool.execute.after.subagent': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'log-agent.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Agent: ${event.properties?.subagentType || 'unknown'}\nTime: ${new Date().toLocaleTimeString()}`,
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
    const userEventConfig = mockUserConfig.events[eventType];
    const global = mockUserConfig;

    if (!global.enabled) {
      return { enabled: false };
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
        scriptToasts: global.scriptToasts,
      };
    }

    if (userEventConfig === false) {
      return { enabled: false };
    }

    const cfg = userEventConfig as {
      enabled?: boolean;
      toast?:
        | boolean
        | {
            enabled?: boolean;
            title?: string;
            message?: string;
            variant?: string;
            duration?: number;
          };
      scripts?: string[];
      runScripts?: boolean;
      saveToFile?: boolean;
      appendToSession?: boolean;
    };

    let scripts: string[] = [];
    if (cfg.runScripts === false) {
      scripts = [];
    } else if (cfg.scripts !== undefined) {
      scripts = cfg.scripts;
    } else if (cfg.runScripts === true || global.runScripts) {
      scripts = [handler.defaultScript];
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
      toastTitle: toastCfg?.title ?? handler.title,
      toastMessage: toastCfg?.message,
      toastVariant: toastCfg?.variant ?? handler.variant,
      toastDuration: toastCfg?.duration ?? handler.duration,
      scripts,
      saveToFile: cfg.saveToFile ?? global.saveToFile,
      appendToSession: cfg.appendToSession ?? global.appendToSession,
      scriptToasts: scriptToastsCfg,
    };
  }

  function resolveToolConfig(toolEventType: string, toolName: string) {
    const toolConfigs = mockUserConfig.tools?.[toolEventType];
    const toolConfig = toolConfigs?.[toolName];

    if (!toolConfig) {
      return resolveEventConfig(toolEventType);
    }

    const handler = mockHandlers[toolEventType];
    const global = mockUserConfig;

    if (toolConfig === false) {
      return { enabled: false };
    }

    const cfg = toolConfig as {
      enabled?: boolean;
      toast?:
        | boolean
        | {
            enabled?: boolean;
            title?: string;
            message?: string;
            variant?: string;
            duration?: number;
          };
      scripts?: string[];
      runScripts?: boolean;
      saveToFile?: boolean;
      appendToSession?: boolean;
    };

    let scripts: string[] = [];
    if (cfg.runScripts === false) {
      scripts = [];
    } else if (cfg.scripts !== undefined) {
      scripts = cfg.scripts;
    } else if (cfg.runScripts === true || global.runScripts) {
      scripts = [handler.defaultScript];
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
      toastTitle: toastCfg?.title ?? handler.title,
      toastMessage: toastCfg?.message,
      toastVariant: toastCfg?.variant ?? handler.variant,
      toastDuration: toastCfg?.duration ?? handler.duration,
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

jest.mock('../../.opencode/plugins/core/toast-queue', () => {
  const mockQueue = {
    add: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    pending: 0,
  };
  return {
    ...jest.requireActual('../../.opencode/plugins/core/toast-queue'),
    initGlobalToastQueue: jest.fn((showFn) => {
      mockQueue.add = jest.fn((toast) => showFn(toast));
      return mockQueue;
    }),
    useGlobalToastQueue: jest.fn(() => mockQueue),
    getGlobalToastQueue: jest.fn(() => mockQueue),
    resetGlobalToastQueue: jest.fn(),
  };
});

jest.mock(
  '../../.opencode/plugins/features/messages/show-startup-toast',
  () => ({
    showStartupToast: jest.fn().mockResolvedValue(undefined),
  })
);

import { saveToFile } from '../../.opencode/plugins/features/persistence/save-to-file';

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
      spawn: jest
        .fn()
        .mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
    };
    jest.clearAllMocks();
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
});

describe('saveToFile', () => {
  let mockClient: MockClient;
  let mockDollar: () => unknown;

  beforeEach(() => {
    mockClient = createMockClient();
    mockDollar = {
      spawn: jest
        .fn()
        .mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
    };
    jest.clearAllMocks();
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
    expect(saveToFile).toHaveBeenCalledTimes(3);
  });

  it('should save EVENT_DISABLED when logDisabledEvents is true', async () => {
    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    await plugin.event({
      event: {
        type: 'session.diff',
        properties: { sessionID: '123', diff: [] },
      },
    });

    expect(saveToFile).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('EVENT_DISABLED'),
      })
    );
  });
});

describe('script error handling', () => {
  let mockClient: MockClient;
  let mockDollar: () => unknown;

  beforeEach(() => {
    mockClient = createMockClient();
    mockDollar = {
      spawn: jest
        .fn()
        .mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
    };
    jest.clearAllMocks();
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
    const event = {
      type: 'session.created',
      properties: { info: createMockSession('error-test-123') },
    };
    await plugin.event({ event });

    const errorToastCall = mockClient.tui.showToast.mock.calls.find(
      (call: [unknown]) => call[0].body.variant === 'error'
    );

    expect(errorToastCall).toBeDefined();
    expect(errorToastCall[0].body.title).toMatch(/ Script Error====$/);
    expect(errorToastCall[0].body.message).toContain('Script not found');
    expect(errorToastCall[0].body.message).toContain('Check settings.ts');
  });

  it('should save error to file when script fails', async () => {
    mockRunScript.mockResolvedValueOnce({
      output: '',
      error: 'Script not found',
      exitCode: -1,
    });

    const ctx = createMockCtx(mockClient, mockDollar);
    const plugin = await OpencodeHooks(ctx);
    const event = {
      type: 'session.created',
      properties: { info: createMockSession('error-test-456') },
    };
    await plugin.event({ event });

    expect(saveToFile).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('"error":"Script not found"'),
      })
    );
  });

  it('should show error toast for tool.execute.after script failure', async () => {
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
      (call: [unknown]) => call[0].body.variant === 'error'
    );

    expect(errorToastCall).toBeDefined();
    expect(errorToastCall[0].body.title).toMatch(/ Script Error====$/);
    expect(errorToastCall[0].body.message).toContain('Agent script failed');
  });
});
