import {
  runScriptAndHandle,
  addSubagentSession,
  resetSubagentTracking,
} from '../../.opencode/plugins/helpers/run-script-handler';

jest.mock('../../.opencode/plugins/helpers/run-script', () => ({
  runScript: jest.fn(),
}));

jest.mock('../../.opencode/plugins/helpers/append-to-session', () => ({
  appendToSession: jest.fn(),
}));

jest.mock('../../.opencode/plugins/helpers/log-event', () => ({
  logScriptOutput: jest.fn(),
}));

jest.mock('../../.opencode/plugins/helpers/save-to-file', () => ({
  saveToFile: jest.fn(),
}));

const mockToastAdd = jest.fn();
jest.mock('../../.opencode/plugins/helpers/toast-queue', () => ({
  useGlobalToastQueue: jest.fn(() => ({
    add: mockToastAdd,
  })),
}));

import { runScript } from '../../.opencode/plugins/helpers/run-script';
import { appendToSession } from '../../.opencode/plugins/helpers/append-to-session';
import { saveToFile } from '../../.opencode/plugins/helpers/save-to-file';
import type { ResolvedEventConfig } from '../../.opencode/plugins/helpers/config';

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
  saveToFile: false,
  appendToSession: false,
  runOnlyOnce: false,
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
    jest.clearAllMocks();
    resetSubagentTracking();
    (runScript as jest.Mock).mockResolvedValue({
      output: 'output',
      error: null,
      exitCode: 0,
    });
    (appendToSession as jest.Mock).mockResolvedValue(undefined);
  });

  describe('runScriptAndHandle', () => {
    it('should run script and handle output', async () => {
      const config = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'test-script.sh',
        scriptArg: 'arg1',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          saveToFile: true,
          appendToSession: false,
          runOnlyOnce: false,
        }),
        sessionId: 'session-1',
      };

      await runScriptAndHandle(config);

      expect(runScript).toHaveBeenCalledWith(
        config.ctx.$,
        'test-script.sh',
        'arg1'
      );
    });

    it('should skip if runOnlyOnce and session is subagent', async () => {
      addSubagentSession('subagent-session');

      const config = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'test-script.sh',
        scriptArg: 'arg1',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          saveToFile: false,
          appendToSession: false,
          runOnlyOnce: true,
        }),
        sessionId: 'subagent-session',
      };

      await runScriptAndHandle(config);

      expect(runScript).not.toHaveBeenCalled();
    });

    it('should run if runOnlyOnce and session is primary', async () => {
      const config = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'test-script.sh',
        scriptArg: 'arg1',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          saveToFile: false,
          appendToSession: false,
          runOnlyOnce: true,
        }),
        sessionId: 'primary-session',
      };

      await runScriptAndHandle(config);

      expect(runScript).toHaveBeenCalled();
    });

    it('should call appendToSession when configured', async () => {
      const config = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'test-script.sh',
        scriptArg: 'arg1',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          saveToFile: false,
          appendToSession: true,
          runOnlyOnce: false,
        }),
        sessionId: 'session-1',
      };

      await runScriptAndHandle(config);

      expect(appendToSession).toHaveBeenCalledWith(
        config.ctx,
        'session-1',
        'output'
      );
    });

    it('should handle script error', async () => {
      (runScript as jest.Mock).mockResolvedValue({
        output: '',
        error: 'Script failed',
        exitCode: -1,
      });

      const config = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'test-script.sh',
        scriptArg: 'arg1',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          saveToFile: false,
          appendToSession: false,
          runOnlyOnce: false,
        }),
        sessionId: 'session-1',
      };

      await runScriptAndHandle(config);

      expect(runScript).toHaveBeenCalled();
    });

    it('should include eventType in error toast message', async () => {
      (runScript as jest.Mock).mockResolvedValue({
        output: '',
        error: 'Script failed',
        exitCode: -1,
      });

      const config = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'test-script.sh',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'session.idle',
        toolName: undefined,
        resolved: createResolvedConfig({}),
        sessionId: 'session-1',
      };

      await runScriptAndHandle(config);

      const toastCalls = mockToastAdd.mock.calls;
      const errorToastCall = toastCalls.find(
        (call: [unknown]) => call[0]?.title === '====SCRIPT ERROR===='
      );

      expect(errorToastCall).toBeDefined();
      expect(errorToastCall[0].message).toContain('Event: session.idle');
      expect(errorToastCall[0].message).toContain('Script: test-script.sh');
      expect(errorToastCall[0].message).toContain('Error: Script failed');
    });

    it('should show only toolName for tool.execute.* events', async () => {
      (runScript as jest.Mock).mockResolvedValue({
        output: '',
        error: 'Script failed',
        exitCode: -1,
      });

      const config = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'test-script.sh',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'tool.execute.after',
        toolName: 'bash',
        resolved: createResolvedConfig({}),
        sessionId: 'session-1',
      };

      await runScriptAndHandle(config);

      const toastCalls = mockToastAdd.mock.calls;
      const errorToastCall = toastCalls.find(
        (call: [unknown]) => call[0]?.title === '====SCRIPT ERROR===='
      );

      expect(errorToastCall).toBeDefined();
      expect(errorToastCall[0].message).toContain('Event: bash');
    });

    it('should include eventType and toolName in error log', async () => {
      (runScript as jest.Mock).mockResolvedValue({
        output: '',
        error: 'Script failed',
        exitCode: -1,
      });

      const config = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'test-script.sh',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'tool.execute.after',
        toolName: 'task',
        resolved: createResolvedConfig({ saveToFile: true }),
        sessionId: 'session-1',
      };

      await runScriptAndHandle(config);

      expect(saveToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('"eventType":"tool.execute.after"'),
          content: expect.stringContaining('"toolName":"task"'),
        })
      );
    });
  });

  describe('resetSubagentTracking', () => {
    it('should run for different primary sessions independently', async () => {
      const config1 = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'test-script.sh',
        scriptArg: 'arg1',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          saveToFile: false,
          appendToSession: false,
          runOnlyOnce: true,
        }),
        sessionId: 'primary-session-1',
      };

      const config2 = {
        ...config1,
        sessionId: 'primary-session-2',
      };

      await runScriptAndHandle(config1);
      await runScriptAndHandle(config2);

      expect(runScript).toHaveBeenCalledTimes(2);
    });

    it('should skip subagent session but run for primary', async () => {
      addSubagentSession('subagent-session');

      const configPrimary = {
        ctx: createMockCtx() as unknown as Parameters<
          typeof runScriptAndHandle
        >[0],
        script: 'test-script.sh',
        scriptArg: 'arg1',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          saveToFile: false,
          appendToSession: false,
          runOnlyOnce: true,
        }),
        sessionId: 'primary-session',
      };

      const configSubagent = {
        ...configPrimary,
        sessionId: 'subagent-session',
      };

      await runScriptAndHandle(configPrimary);
      await runScriptAndHandle(configSubagent);

      expect(runScript).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle script execution error', async () => {
      (runScript as jest.Mock).mockResolvedValueOnce({
        output: '',
        error: 'Script failed',
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
      };

      await runScriptAndHandle(config);

      expect(saveToFile).toHaveBeenCalled();
    });

    it('should handle non-Error rejection', async () => {
      (runScript as jest.Mock).mockResolvedValueOnce({
        output: '',
        error: 'String error',
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
      };

      await runScriptAndHandle(config);

      expect(saveToFile).toHaveBeenCalled();
    });

    it('should handle error with special characters', async () => {
      (runScript as jest.Mock).mockResolvedValueOnce({
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
      };

      await runScriptAndHandle(config);

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
