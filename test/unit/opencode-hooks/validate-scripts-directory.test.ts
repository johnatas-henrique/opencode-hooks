import fs from 'fs';
import path from 'path';
import type { PluginInput } from '@opencode-ai/plugin';

vi.mock('.opencode/plugins/config/settings', () => ({
  userConfig: {
    enabled: true,
    toast: true,
    logToAudit: false,
    appendToSession: false,
    runScripts: false,
    logDisabledEvents: false,
    events: {},
    tools: {},
    default: {
      debug: false,
      toast: true,
      runScripts: false,
      runOnlyOnce: false,
      logToAudit: false,
      appendToSession: false,
    },
    scriptToasts: {
      showOutput: true,
      showError: true,
      outputVariant: 'info',
      errorVariant: 'error',
    },
    audit: { enabled: false },
  },
}));

vi.mock('.opencode/plugins/core/toast-queue', () => ({
  initGlobalToastQueue: vi.fn(),
  useGlobalToastQueue: () => ({
    add: vi.fn(),
    addMultiple: vi.fn(),
    clear: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('.opencode/plugins/features/scripts/run-script-handler', () => ({
  isSubagent: vi.fn(),
  addSubagentSession: vi.fn(),
  resetSubagentTracking: vi.fn(),
  runScriptAndHandle: vi
    .fn()
    .mockResolvedValue({ output: '', error: null, exitCode: 0 }),
}));

vi.mock('.opencode/plugins/features/messages/show-startup-toast', () => ({
  showStartupToast: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('.opencode/plugins/core/constants', () => ({
  DEFAULTS: {
    scripts: { dir: '.opencode/scripts' },
    toast: { durations: { TEN_SECONDS: 10000 } },
  },
}));

vi.mock('.opencode/plugins/features/events/events', () => ({
  resolveEventConfig: vi.fn().mockReturnValue({
    enabled: true,
    toast: true,
    toastMessage: undefined,
    toastTitle: undefined,
    toastVariant: undefined,
    toastDuration: 0,
    runScripts: false,
    scripts: [],
    logToAudit: false,
    debug: false,
  }),
  resolveToolConfig: vi.fn(),
  handlers: {},
  getHandler: vi.fn(),
  getToolHandler: vi.fn(),
}));

vi.mock('.opencode/plugins/features/audit/plugin-integration', () => ({
  initAuditLogging: vi.fn().mockResolvedValue(undefined),
  getEventRecorder: () => ({
    logEvent: vi.fn(),
    logToolExecuteBefore: async () => {},
    logToolExecuteAfter: async () => {},
    logSessionEvent: async () => {},
  }),
  getScriptRecorder: vi.fn(),
  getErrorRecorder: vi.fn(),
  getLastKnownSessionId: vi.fn().mockReturnValue('test-session'),
  setAuditSessionId: vi.fn(),
  archiveAuditSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('.opencode/plugins/features/messages/toast-silence-detector', () => ({
  createToastSilenceDetector: vi.fn().mockReturnValue({
    shouldSilence: vi.fn().mockReturnValue(false),
    record: vi.fn(),
  }),
}));

vi.mock('.opencode/plugins/features/messages/plugin-status', () => ({
  createPluginStatusManager: vi.fn().mockReturnValue({
    hasShownStatus: vi.fn().mockReturnValue(false),
    markStatusShown: vi.fn(),
  }),
}));

vi.mock('.opencode/plugins/features/core/toast-director', () => ({
  ToastDirector: vi.fn().mockImplementation(() => ({
    queue: vi.fn(),
    show: vi.fn().mockResolvedValue(undefined),
    flush: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('.opencode/plugins/features/messages/append-to-session', () => ({
  appendToSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('.opencode/plugins/features/block-system/block-handler', () => ({
  executeBlocking: vi.fn().mockResolvedValue({ action: 'allow' }),
}));

vi.mock('.opencode/plugins/core/debug', () => ({
  handleDebugLog: vi.fn(),
}));

vi.mock('.opencode/plugins/features/scripts/executor', () => ({
  executeScript: vi
    .fn()
    .mockResolvedValue({ script: '', output: '', exitCode: 0 }),
}));

vi.mock('.opencode/plugins/features/audit/script-recorder', () => ({
  createScriptRecorder: vi.fn().mockReturnValue({
    logScript: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('OpencodeHooks plugin startup validation', () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    try {
      process.chdir(originalCwd);
    } catch {
      process.chdir('/');
    }
    vi.resetModules();
  });

  afterEach(async () => {
    try {
      process.chdir(originalCwd);
    } catch {
      try {
        process.chdir('/');
      } catch {
        // ignore
      }
    }
    await vi.waitFor(() => {});
  });

  it('should throw during plugin initialization when scripts directory missing', async () => {
    const tempDir = path.join(originalCwd, 'test-temp-init');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    process.chdir(tempDir);

    const { OpencodeHooks } = await import('.opencode/plugins/opencode-hooks');

    const mockPluginInput = {
      client: {
        tui: {
          showToast: () => {},
        },
        config: {},
      },
    } as Partial<PluginInput> as PluginInput;

    await expect(OpencodeHooks(mockPluginInput)).rejects.toThrow(
      'Scripts directory not found'
    );
  });
});
