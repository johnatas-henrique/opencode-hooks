import { vi } from 'vitest';

export function createDefaultMockSetup() {
  vi.mock('.opencode/plugins/features/handlers', () => ({
    handlers: {},
  }));

  vi.mock('.opencode/plugins/features/messages/append-to-session', () => ({
    appendToSession: vi.fn().mockResolvedValue(undefined),
  }));

  vi.mock('.opencode/plugins/features/scripts/executor', () => ({
    executeScript: vi.fn().mockResolvedValue({
      script: 'mock-script.sh',
      output: '',
      exitCode: 0,
    }),
    resolveScriptPath: vi.fn().mockReturnValue('/mock/path'),
    validateScriptPath: vi.fn().mockReturnValue(true),
    parseHookOutput: vi.fn().mockReturnValue({ action: 'continue' }),
  }));

  vi.mock('.opencode/plugins/features/audit/script-recorder', () => ({
    getScriptRecorder: vi.fn().mockReturnValue(null),
    createScriptRecorder: vi.fn().mockReturnValue(null),
  }));
}

export function createMockScriptHandler() {
  return vi.mock(
    '.opencode/plugins/features/scripts/run-script-handler',
    () => ({
      isSubagent: vi.fn().mockReturnValue(false),
      addSubagentSession: vi.fn(),
      resetSubagentTracking: vi.fn(),
      runScriptAndHandle: vi.fn(),
    })
  );
}

export function createMockRunScript() {
  return vi.mock('.opencode/plugins/features/scripts/run-script', () => ({
    runScript: vi
      .fn()
      .mockResolvedValue({ output: 'Script output', error: null, exitCode: 0 }),
  }));
}

export function createMockEvents(handlers: Record<string, unknown> = {}) {
  return vi.mock('.opencode/plugins/features/events/events', () => ({
    resolveEventConfig: vi.fn(),
    resolveToolConfig: vi.fn(),
    EventType: {
      SESSION_CREATED: 'session.created',
      SHELL_ENV: 'shell.env',
      CHAT_MESSAGE: 'chat.message',
      CHAT_PARAMS: 'chat.params',
    },
    handlers,
    getHandler: vi.fn(),
    getToolHandler: vi.fn(),
  }));
}

export function createMockAuditPluginIntegration() {
  return vi.mock('.opencode/plugins/features/audit/plugin-integration', () => ({
    initAuditLogging: vi.fn().mockResolvedValue(undefined),
    getEventRecorder: () => ({
      logEvent: vi.fn(),
      logToolExecuteBefore: vi.fn(),
      logToolExecuteAfter: vi.fn(),
      logSessionEvent: vi.fn(),
    }),
    getScriptRecorder: vi.fn(),
    getErrorRecorder: vi.fn(),
    getLastKnownSessionId: vi.fn().mockReturnValue('test-session'),
    setAuditSessionId: vi.fn(),
    archiveAuditSession: vi.fn().mockResolvedValue(undefined),
  }));
}

export function createGlobalMockQueue() {
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
}
