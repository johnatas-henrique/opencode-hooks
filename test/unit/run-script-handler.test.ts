const mockToastAdd = vi.fn().mockResolvedValue(undefined);

vi.mock('../../.opencode/plugins/core/toast-queue', () => ({
  createToastQueue: vi.fn(),
  initGlobalToastQueue: vi.fn(),
  useGlobalToastQueue: () => ({
    add: mockToastAdd,
  }),
  resetGlobalToastQueue: vi.fn(),
  showToastStaggered: vi.fn(),
}));

import {
  runScriptAndHandle,
  resetSubagentTracking,
} from '../../.opencode/plugins/features/scripts/run-script-handler';

vi.mock('../../.opencode/plugins/features/scripts/run-script', () => ({
  runScript: vi.fn(),
}));

vi.mock('../../.opencode/plugins/features/messages/append-to-session', () => ({
  appendToSession: vi.fn(),
}));

vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: vi.fn().mockResolvedValue(undefined),
}));

import { runScript } from '../../.opencode/plugins/features/scripts/run-script';
import { appendToSession } from '../../.opencode/plugins/features/messages/append-to-session';
import { saveToFile } from '../../.opencode/plugins/features/persistence/save-to-file';
import type { ResolvedEventConfig } from '../../.opencode/plugins/core/config';

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
  saveToFile: false,
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
  ...overrides,
});

const createMockCtx = () => ({
  $: {
    client: {},
    project: {},
    directory: '',
    worktree: '',
    serverUrl: new URL('http://localhost'),
  },
});

describe('run-script-handler.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSubagentTracking();
    (runScript as vi.Mock).mockResolvedValue({
      output: 'output',
      error: null,
      exitCode: 0,
    });
    (appendToSession as vi.Mock).mockResolvedValue(undefined);
  });

  describe('error handling', () => {
    it('should handle error with special characters', async () => {
      (runScript as vi.Mock).mockResolvedValueOnce({
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
          saveToFile: true,
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

      const result = await runScriptAndHandle(config);

      expect(result).toEqual({
        script: 'failing-script.sh',
        output: undefined,
      });

      expect(saveToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining(
            '"error":"Error with special characters"'
          ),
        })
      );
    });
  });
});

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
describe('runScriptAndHandle with scriptRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runScriptAndHandle scriptRecorder parameter', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('runScriptAndHandle line coverage', () => {
      const mockWriteLine = vi.fn().mockResolvedValue(undefined);

      beforeEach(() => {
        vi.clearAllMocks();
      });

      it('should use DEFAULT_SESSION_ID when sessionId not provided (line 42)', async () => {
        runScript.mockResolvedValueOnce({
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
          resolved: createResolvedConfig({ saveToFile: true }),
          scriptToasts: createScriptToastsConfig(),
          scriptRecorder: { logScript: mockWriteLine },
          // sessionId not provided - should use DEFAULT_SESSION_ID
        };

        await runScriptAndHandle(config);

        expect(mockWriteLine).toHaveBeenCalled();
      });

      describe('Specific branch coverage', () => {
        beforeEach(() => {
          vi.clearAllMocks();
        });

        it('covers showError branch (line 88)', async () => {
          runScript.mockResolvedValueOnce({
            output: '',
            error: 'error',
            exitCode: 1,
          });

          const ctx = createMockCtx();
          const resolvedConfig = createResolvedConfig();
          resolvedConfig.toast = true;
          resolvedConfig.toastTitle = '===';
          resolvedConfig.scriptToasts = {
            showOutput: true,
            outputTitle: 'Output',
            showError: true,
            outputVariant: 'info',
            errorVariant: 'error',
            errorTitle: 'Error',
            outputDuration: 5000,
            errorDuration: 15000,
          };

          const config = {
            ctx,
            script: 'error.sh',
            timestamp: '2024-01-01',
            eventType: 'test.event',
            resolved: resolvedConfig,
            scriptToasts: resolvedConfig.scriptToasts,
            sessionId: 'test-session',
          };

          await runScriptAndHandle(config);

          expect(mockToastAdd).toHaveBeenCalled();
        });

        describe('Branch coverage tests', () => {
          beforeEach(() => {
            vi.clearAllMocks();
          });

          it('covers showError=false branch (line 88)', async () => {
            runScript.mockResolvedValueOnce({
              output: '',
              error: 'error',
              exitCode: 1,
            });

            const ctx = createMockCtx();
            const resolvedConfig = createResolvedConfig();
            resolvedConfig.scriptToasts = {
              showOutput: false,
              outputTitle: 'Output',
              showError: false,
              outputVariant: 'info',
              errorVariant: 'error',
              errorTitle: 'Error',
              outputDuration: 5000,
              errorDuration: 15000,
            };

            const config = {
              ctx,
              script: 'error.sh',
              timestamp: '2024-01-01',
              eventType: 'test.event',
              resolved: resolvedConfig,
              scriptToasts: resolvedConfig.scriptToasts,
              sessionId: 'test-session',
            };

            await runScriptAndHandle(config);

            expect(mockToastAdd).not.toHaveBeenCalled();
          });

          it('covers non-.sh script branch (line 101)', async () => {
            runScript.mockResolvedValueOnce({
              output: 'output',
              error: null,
              exitCode: 0,
            });

            const ctx = createMockCtx();
            const config = {
              ctx,
              script: 'node-script.js',
              timestamp: '2024-01-01',
              eventType: 'test.event',
              resolved: {
                ...createResolvedConfig({ saveToFile: true }),
                scriptToasts: createScriptToastsConfig(),
              },
              scriptToasts: createScriptToastsConfig(),
              sessionId: 'test-session',
              scriptRecorder: { logScript: vi.fn() },
            };

            await runScriptAndHandle(config);

            expect(config.scriptRecorder.logScript).toHaveBeenCalledWith(
              expect.objectContaining({ script: 'node-script.js' }),
              expect.any(Object)
            );
          });
        });
      });
    });
  });
});
