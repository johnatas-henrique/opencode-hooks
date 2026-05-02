const mockToastAdd = vi.fn().mockResolvedValue(undefined);

vi.mock('.opencode/plugins/core/toast-queue', () => ({
  createToastQueue: vi.fn(),
  initGlobalToastQueue: vi.fn(),
  useGlobalToastQueue: () => ({
    add: mockToastAdd,
  }),
  resetGlobalToastQueue: vi.fn(),
  showToastStaggered: vi.fn(),
}));

import type { Mock } from 'vitest';
import {
  runScriptAndHandle,
  resetSubagentTracking,
} from '.opencode/plugins/features/scripts/run-script-handler';

vi.mock('.opencode/plugins/features/scripts/run-script', () => ({
  runScript: vi.fn(),
}));

vi.mock('.opencode/plugins/features/messages/append-to-session', () => ({
  appendToSession: vi.fn(),
}));

import { runScript } from '.opencode/plugins/features/scripts/run-script';
import { appendToSession } from '.opencode/plugins/features/messages/append-to-session';
import type { ResolvedEventConfig } from '.opencode/plugins/types/config';

const mockRunScript = runScript as Mock;
const mockAppendToSession = appendToSession as Mock;

const createResolvedConfig = (
  overrides: Partial<ResolvedEventConfig> = {}
): ResolvedEventConfig => ({
  enabled: true,
  debug: false,
  toast: true,
  toastTitle: 'Test',
  toastMessage: 'Test message',
  toastVariant: 'info',
  toastDuration: 5000,
  scripts: [],
  runScripts: false,
  logToAudit: false,
  appendToSession: false,
  runOnlyOnce: false,
  scriptToasts: {
    showOutput: true,
    outputTitle: "'Script Output'",
    showError: true,
    outputVariant: 'info',
    errorVariant: 'error',
    errorTitle: "'Script Error'",
    outputDuration: 5000,
    errorDuration: 15000,
  },
  block: [],
  ...overrides,
});

const createMockCtx = () =>
  ({
    $: {
      client: {},
      project: {},
      directory: '',
      worktree: '',
      serverUrl: new URL('http://localhost'),
    },
  }) as unknown as Parameters<typeof runScriptAndHandle>[0]['ctx'];

const createScriptToastsConfig = () => ({
  showOutput: true,
  outputTitle: 'Script Output',
  showError: true,
  outputVariant: 'info',
  errorVariant: 'error',
  errorTitle: 'Script Error',
  outputDuration: 5000,
  errorDuration: 15000,
});

describe('run-script-handler.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSubagentTracking();
    mockRunScript.mockResolvedValue({
      output: 'output',
      error: null,
      exitCode: 0,
    });
    mockAppendToSession.mockResolvedValue(undefined);
  });

  describe('runOnlyOnce with subagent', () => {
    it('should run script when runOnlyOnce is true but sessionId is not subagent', async () => {
      const config = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'once-script.sh',
        scriptArg: '',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          runOnlyOnce: true,
          runScripts: true,
        }),
        sessionId: 'main-session',
        scriptToasts: createScriptToastsConfig(),
      };

      await runScriptAndHandle(config as never);

      expect(mockRunScript).toHaveBeenCalled();
    });

    it('should use toolName in error message when tool.execute event type (line 69 branch)', async () => {
      mockRunScript.mockResolvedValueOnce({
        output: '',
        error: 'tool failed',
        exitCode: 1,
      });

      const config = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'tool-script.sh',
        scriptArg: '',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'tool.execute.before',
        toolName: 'read-file',
        resolved: createResolvedConfig({
          runScripts: true,
        }),
        sessionId: 'main-session',
        scriptToasts: {
          showOutput: false,
          outputTitle: 'Output',
          showError: true,
          outputVariant: 'info',
          errorVariant: 'error',
          errorTitle: 'Error',
          outputDuration: 5000,
          errorDuration: 15000,
        },
      };

      await runScriptAndHandle(config as never);

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('read-file'),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle error with special characters', async () => {
      mockRunScript.mockResolvedValueOnce({
        output: '',
        error: 'Error with special characters',
        exitCode: -1,
      });

      const config = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'failing-script.sh',
        scriptArg: 'arg1',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          logToAudit: true,
          appendToSession: false,
          runOnlyOnce: false,
        }),
        sessionId: 'session-1',
        scriptToasts: {
          showOutput: true,
          outputTitle: "'Script Output'",
          showError: true,
          outputVariant: 'info',
          errorVariant: 'error',
          errorTitle: "'Script Error'",
          outputDuration: 5000,
          errorDuration: 15000,
        },
      };

      const result = await runScriptAndHandle(config as never);

      expect(result).toEqual({
        script: 'failing-script.sh',
        output: undefined,
      });
    });
  });
});

describe('runScriptAndHandle with scriptRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('appendToSession coverage (line 111)', () => {
    it('should call appendToSession when resolved.appendToSession is true', async () => {
      mockRunScript.mockResolvedValueOnce({
        output: 'session output',
        error: null,
        exitCode: 0,
      });

      const ctx = createMockCtx();
      const config = {
        ctx,
        script: 'test.sh',
        timestamp: '2024-01-01',
        eventType: 'test.event',
        resolved: createResolvedConfig({ appendToSession: true }),
        scriptToasts: createScriptToastsConfig(),
        sessionId: 'test-session',
      };

      await runScriptAndHandle(config as never);

      expect(mockAppendToSession).toHaveBeenCalledWith(
        ctx,
        'test-session',
        'session output'
      );
    });
  });

  describe('runScriptAndHandle line coverage', () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);

    it('should use DEFAULT_SESSION_ID when sessionId not provided (line 42)', async () => {
      mockRunScript.mockResolvedValueOnce({
        output: 'output',
        error: null,
        exitCode: 0,
      });

      const ctx = createMockCtx();
      const config = {
        ctx,
        script: 'test.sh',
        timestamp: '2024-01-01',
        eventType: 'test.event',
        resolved: createResolvedConfig({ logToAudit: true }),
        scriptToasts: createScriptToastsConfig(),
        scriptRecorder: { logScript: mockWriteLine },
      };

      await runScriptAndHandle(config as never);

      expect(mockWriteLine).toHaveBeenCalled();
    });
  });
});
