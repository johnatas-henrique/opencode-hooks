import type { PluginInput } from '@opencode-ai/plugin';

export const mockUserConfig = {
  enabled: true,
  default: {
    debug: false,
    toast: true,
    runScripts: false,
    runOnlyOnce: false,
    saveToFile: true,
    appendToSession: true,
  },
  events: {
    'session.created': true,
    'session.error': { saveToFile: false, appendToSession: false },
    'session.disabled': false,
    'session.custom': {
      scripts: ['custom-a.sh', 'custom-b.sh'],
    },
    'session.no-scripts': {
      runScripts: false,
      scripts: ['should-be-ignored.sh'],
    },
    'session.toast-off': { toast: false },
    'session.toast-custom': {
      toast: {
        title: 'Custom Title',
        variant: 'warning',
        duration: 5000,
        message: 'Custom message',
      },
    },
    'session.save-override': { saveToFile: false },
    'session.append-override': { appendToSession: false },
    'session.run-once': { scripts: ['run-once.sh'], runOnlyOnce: true },
    'unknown.event': {
      toast: true,
      scripts: ['unknown.event.sh'],
      saveToFile: true,
      appendToSession: true,
    },
    'session.toast-defaults': { toast: true, runScripts: true },
  },
  tools: {
    'tool.execute.after': {
      task: {
        toast: true,
        scripts: ['log-agent.sh'],
        runOnlyOnce: true,
      },
      chat: { toast: false },
      'git.commit': { runScripts: false },
      disabled: false,
    },
  },
};

export const mockHandlers = {
  'session.created': {
    title: '====SESSION CREATED====',
    variant: 'success',
    duration: 2000,
    defaultScript: 'session-created.sh',
    buildMessage: (event: Record<string, unknown>) =>
      `Session Id: ${String(event.properties?.info?.id)}\nTime: now`,
  },
  'session.error': {
    title: '====SESSION ERROR====',
    variant: 'error',
    duration: 30000,
    defaultScript: 'session-error.sh',
    buildMessage: (event: Record<string, unknown>) =>
      `Session Id: ${String(event.properties?.sessionID)}\nError: ${String(event.properties?.error?.name || 'Unknown error')}\nTime: now`,
  },
  'session.disabled': {
    title: '====DISABLED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-disabled.sh',
    buildMessage: () => 'disabled',
  },
  'session.custom': {
    title: '====CUSTOM====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-custom.sh',
    buildMessage: () => 'custom',
  },
  'session.no-scripts': {
    title: '====NO SCRIPTS====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-no-scripts.sh',
    buildMessage: () => 'no scripts',
  },
  'session.toast-off': {
    title: '====TOAST OFF====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-toast-off.sh',
    buildMessage: () => 'toast off',
  },
  'session.toast-custom': {
    title: '====TOAST CUSTOM====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-toast-custom.sh',
    buildMessage: () => 'toast custom',
  },
  'session.save-override': {
    title: '====SAVE OVERRIDE====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-save-override.sh',
    buildMessage: () => 'save override',
  },
  'session.append-override': {
    title: '====APPEND OVERRIDE====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-append-override.sh',
    buildMessage: () => 'append override',
  },
  'unknown.event': {
    title: '',
    variant: 'info',
    duration: 0,
    defaultScript: 'unknown.event.sh',
    buildMessage: () => 'unknown',
  },
  'session.unknown': {
    title: '====UNKNOWN====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-unknown.sh',
    buildMessage: () => 'unknown',
  },
  'tool.execute.before': {
    title: '====TOOL BEFORE====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tool-execute-before.sh',
    buildMessage: () => 'tool',
  },
  'tool.execute.after': {
    title: '====TOOL AFTER====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tool-execute-after.sh',
    buildMessage: () => 'tool',
  },
  'server.instance.disposed': {
    title: '',
    variant: 'info',
    duration: 0,
    defaultScript: 'session-stop.sh',
    buildMessage: (event: Record<string, unknown>) =>
      `Directory: ${String(event.properties?.directory || 'unknown')}\nTime: now`,
  },
};

export const mockSaveToFile = {
  saveToFile: vi.fn().mockResolvedValue(undefined),
};

export const mockRunScript = {
  runScript: vi.fn().mockResolvedValue({
    output: 'script output',
    exitCode: 0,
    error: undefined,
  }),
};

export const createMockDollar = (
  output = 'script output',
  exitCode = 0
): vi.MockedFunction<PluginInput['$']> => {
  return vi.fn((_strings: TemplateStringsArray) => {
    const result = {
      quiet: vi.fn().mockReturnValue({
        text: vi.fn().mockReturnValue(output),
        exitCode,
      }),
    };
    return result;
  }) as unknown as vi.MockedFunction<PluginInput['$']>;
};

export const mockToastQueue = {
  add: vi.fn(),
  addMultiple: vi.fn(),
  clear: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined),
  get pending() {
    return 0;
  },
};
