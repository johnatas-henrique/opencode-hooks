import {
  runScriptAndHandle,
  resetRunOnceTracker,
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

jest.mock('../../.opencode/plugins/helpers/toast-queue', () => ({
  useGlobalToastQueue: jest.fn(() => ({
    add: jest.fn(),
  })),
}));

jest.mock('../../.opencode/plugins/helpers/session', () => ({
  isPrimarySession: jest.fn(),
  resetSessionTracking: jest.fn(),
}));

import { runScript } from '../../.opencode/plugins/helpers/run-script';
import { appendToSession } from '../../.opencode/plugins/helpers/append-to-session';
import { isPrimarySession } from '../../.opencode/plugins/helpers/session';
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
    resetRunOnceTracker();
    (runScript as jest.Mock).mockResolvedValue('output');
    (appendToSession as jest.Mock).mockResolvedValue(undefined);
    (isPrimarySession as jest.Mock).mockReturnValue(true);
  });

  describe('runScriptAndHandle', () => {
    it('should run script and handle output', async () => {
      const config = {
        ctx: createMockCtx() as any,
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

    it('should skip if runOnlyOnce and already ran', async () => {
      const config = {
        ctx: createMockCtx() as any,
        script: 'test-script.sh',
        scriptArg: 'arg1',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          saveToFile: false,
          appendToSession: false,
          runOnlyOnce: true,
        }),
        sessionId: 'session-1',
      };

      await runScriptAndHandle(config);
      await runScriptAndHandle(config);

      expect(runScript).toHaveBeenCalledTimes(1);
    });

    it('should call appendToSession when configured', async () => {
      const config = {
        ctx: createMockCtx() as any,
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
      (runScript as jest.Mock).mockRejectedValue(new Error('Script failed'));

      const config = {
        ctx: createMockCtx() as any,
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
  });

  describe('resetRunOnceTracker', () => {
    it('should reset the tracker', async () => {
      const config = {
        ctx: createMockCtx() as any,
        script: 'test-script.sh',
        scriptArg: 'arg1',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          saveToFile: false,
          appendToSession: false,
          runOnlyOnce: true,
        }),
        sessionId: 'session-1',
      };

      await runScriptAndHandle(config);
      resetRunOnceTracker();
      await runScriptAndHandle(config);

      expect(runScript).toHaveBeenCalledTimes(2);
    });

    it('should reset tracker for different sessions independently', async () => {
      (isPrimarySession as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const config1 = {
        ctx: createMockCtx() as any,
        script: 'test-script.sh',
        scriptArg: 'arg1',
        timestamp: '2026-01-01T00:00:00Z',
        eventType: 'test.event',
        resolved: createResolvedConfig({
          saveToFile: false,
          appendToSession: false,
          runOnlyOnce: true,
        }),
        sessionId: 'session-1',
      };

      const config2 = {
        ...config1,
        sessionId: 'session-2',
      };

      await runScriptAndHandle(config1);
      await runScriptAndHandle(config2);

      expect(runScript).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle script execution error', async () => {
      (runScript as jest.Mock).mockRejectedValueOnce(
        new Error('Script failed')
      );

      const config = {
        ctx: createMockCtx() as any,
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
      (runScript as jest.Mock).mockRejectedValueOnce('String error');

      const config = {
        ctx: createMockCtx() as any,
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
      (runScript as jest.Mock).mockRejectedValueOnce(
        new Error('Error with special \x00\x1F characters')
      );

      const config = {
        ctx: createMockCtx() as any,
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
            '"errorMessage":"Error with special ?? characters"'
          ),
        })
      );
    });
  });
});
