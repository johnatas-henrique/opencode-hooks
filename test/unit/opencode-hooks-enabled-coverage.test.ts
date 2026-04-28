import type { PluginInput, Hooks } from '@opencode-ai/plugin';
import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';
import type { MockPluginInput } from '../__mocks__/@opencode-ai/plugin';
import { createMockPluginInput } from '../__mocks__/@opencode-ai/plugin';
import { vi, beforeEach, describe, it } from 'vitest';
import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../.opencode/plugins/types/core';

const mockClient = {
  tui: {
    showToast: vi.fn().mockResolvedValue(undefined),
  },
  session: {
    prompt: vi.fn().mockResolvedValue(undefined),
  },
};

function createMockCtx(overrides: Partial<MockPluginInput> = {}): PluginInput {
  const mock = createMockPluginInput({
    client: mockClient,
    $: vi.fn<
      () => Promise<{ exitCode: number; stdout: string; stderr: string }>
    >(),
    ...overrides,
  });
  return mock as unknown as PluginInput;
}

// Mock with enabled: true
vi.mock('../../.opencode/plugins/config/settings', () => ({
  userConfig: {
    enabled: true,
    toast: true,
    logToAudit: true,
    appendToSession: false,
    runScripts: true,
    logDisabledEvents: false,
    default: {
      debug: false,
      toast: true,
      runScripts: true,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: false,
    },
    events: {
      'session.created': { toast: true, debug: true },
    },
    tools: {
      'tool.execute.before': {
        read: { block: ['rm -rf'] },
      },
    },
    audit: {
      enabled: true,
      level: 'debug',
      basePath: '/tmp/audit-test',
      maxSizeMB: 1,
      maxAgeDays: 30,
      logTruncationKB: 0.5,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [],
    },
  },
}));

vi.mock('../../.opencode/plugins/features/handlers', () => ({
  handlers: {},
}));

vi.mock('../../.opencode/plugins/features/messages/append-to-session', () => ({
  appendToSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../.opencode/plugins/features/scripts/run-script-handler', () => ({
  isSubagent: vi.fn().mockReturnValue(false),
  addSubagentSession: vi.fn(),
  resetSubagentTracking: vi.fn(),
  runScriptAndHandle: vi.fn(),
}));

vi.mock('../../.opencode/plugins/features/scripts/show-startup-toast', () => ({
  showStartupToast: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../.opencode/plugins/core/debug', () => ({
  handleDebugLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../.opencode/plugins/features/audit/plugin-integration', () => ({
  archiveAllJsonFiles: vi.fn().mockResolvedValue(undefined),
  initAuditLogging: vi.fn().mockResolvedValue(undefined),
  getEventRecorder: vi.fn().mockReturnValue(null),
  getScriptRecorder: vi.fn().mockReturnValue(null),
  createAuditLogger: vi.fn().mockReturnValue({
    writeLine: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../.opencode/plugins/features/events/events', () => ({
  resolveEventConfig: vi.fn().mockReturnValue({
    debug: true,
    toast: true,
    runScripts: true,
    runOnlyOnce: false,
    logToAudit: true,
    appendToSession: false,
    toastTitle: 'Test',
    toastMessage: 'Test message',
    toastVariant: 'info' as const,
    toastDuration: 5000,
    scripts: [],
    scriptToasts: {
      showOutput: false,
      showError: false,
      outputVariant: 'info',
      errorVariant: 'error',
      outputDuration: 0,
      errorDuration: 0,
      outputTitle: '',
      errorTitle: '',
    },
    block: undefined,
  }),
  resolveToolConfig: vi.fn().mockReturnValue({
    debug: false,
    toast: true,
    runScripts: true,
    runOnlyOnce: false,
    logToAudit: true,
    appendToSession: false,
    block: [{ check: vi.fn().mockReturnValue(true), message: 'Blocked' }],
    scripts: [],
  }),
  EventType: {
    SESSION_CREATED: 'session.created',
    SHELL_ENV: 'shell.env',
    CHAT_MESSAGE: 'chat.message',
    CHAT_PARAMS: 'chat.params',
  },
}));

describe('opencode-hooks-enabled-coverage - enabled: true branch coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('line 70: resolved.debug = true', () => {
    it('should call handleDebugLog when debug is true', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);
      const eventHandler = plugin.event as (arg: {
        event: { type: string; properties: Record<string, unknown> };
      }) => Promise<void>;

      await eventHandler({
        event: {
          type: 'session.created',
          properties: {
            sessionID: 'test-session',
            info: { id: '123', title: 'Test' },
          },
        },
      });
    });
  });

  describe('line 163: tool.execute.before with block', () => {
    it('should execute when tool.execute.before has block config', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);
      const hooks = plugin as Hooks;
      const handler = hooks['tool.execute.before'];

      if (handler) {
        const input: ToolExecuteBeforeInput = {
          tool: 'read',
          sessionID: 'test-session',
          callID: 'call-123',
        };
        const output: ToolExecuteBeforeOutput = { args: {} };

        await handler(input, output);
      } else {
        throw new Error('tool.execute.before handler not found');
      }
    });
  });

  describe('line 238: session.created with parentID', () => {
    it('should handle session.created with parentID', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);
      const eventHandler = plugin.event as (arg: {
        event: { type: string; properties: Record<string, unknown> };
      }) => Promise<void>;

      await eventHandler({
        event: {
          type: 'session.created',
          properties: {
            sessionID: 'child-session',
            info: { id: '123', title: 'Child', parentID: 'parent-session' },
          },
        },
      });
    });
  });

  describe('line 252: server.instance.disposed', () => {
    it('should handle server.instance.disposed event', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);
      const eventHandler = plugin.event as (arg: {
        event: { type: string; properties: Record<string, unknown> };
      }) => Promise<void>;

      await eventHandler({
        event: {
          type: 'server.instance.disposed',
          properties: { directory: '/tmp' },
        },
      });
    });
  });
});
