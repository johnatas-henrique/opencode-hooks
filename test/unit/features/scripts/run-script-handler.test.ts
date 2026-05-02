import {
  runScriptAndHandle,
  isSubagent,
  addSubagentSession,
  resetSubagentTracking,
} from '.opencode/plugins/features/scripts/run-script-handler';
import type { EventScriptConfig } from '.opencode/plugins/types/scripts';
import type { ScriptRecorder } from '.opencode/plugins/types/audit';

interface TestScriptConfig extends EventScriptConfig {
  toastTitle?: string;
  ctx?: {
    $: string;
    client: string;
    project: string;
    directory: string;
    worktree: string;
  };
  timestamp?: string;
  scriptRecorder?: ScriptRecorder;
}

// Mock only the external dependencies, not the internal logic
vi.mock('.opencode/plugins/features/scripts/run-script', () => ({
  runScript: vi.fn().mockResolvedValue({
    output: 'mock output',
    error: null,
    exitCode: 0,
  }),
}));

vi.mock('.opencode/plugins/features/scripts/adapters', () => ({
  createAuditAdapter: vi.fn(() => undefined),
  createSessionAdapter: vi.fn(() => ({
    appendToSession: vi.fn().mockResolvedValue(undefined),
  })),
  createToastAdapter: vi.fn(() => undefined),
}));

vi.mock('.opencode/plugins/core/constants', () => ({
  DEFAULTS: {
    core: { defaultSessionId: 'unknown' },
    scripts: { dir: 'scripts' },
    toast: { durations: { TEN_SECONDS: 10000 } },
  },
}));

import { runScript } from '.opencode/plugins/features/scripts/run-script';

const mockRunScript = runScript as unknown as ReturnType<typeof vi.fn>;

describe('run-script-handler', () => {
  beforeEach(() => {
    resetSubagentTracking();
    vi.clearAllMocks();
  });

  describe('isSubagent, addSubagentSession, resetSubagentTracking', () => {
    it('isSubagent returns false for undefined', () => {
      expect(isSubagent(undefined)).toBe(false);
    });

    it('isSubagent returns false for untracked', () => {
      expect(isSubagent('sess-1')).toBe(false);
    });

    it('isSubagent returns true for tracked', () => {
      addSubagentSession('sess-1');
      expect(isSubagent('sess-1')).toBe(true);
    });

    it('reset clears tracking', () => {
      addSubagentSession('sess-1');
      resetSubagentTracking();
      expect(isSubagent('sess-1')).toBe(false);
    });
  });

  describe('runScriptAndHandle', () => {
    const baseConfig: TestScriptConfig = {
      script: 'test.sh',
      eventType: 'session.created',
      resolved: {
        enabled: true,
        debug: false,
        toast: false,
        toastMessage: '',
        logToAudit: false,
        appendToSession: false,
        runOnlyOnce: false,
        scriptToasts: {
          showOutput: false,
          showError: false,
          outputVariant: 'success',
          errorVariant: 'error',
          outputDuration: 3000,
          errorDuration: 5000,
          outputTitle: 'Output',
          errorTitle: 'Error',
        },
        toastTitle: 'Test',
      },
      scriptToasts: {
        showOutput: false,
        showError: false,
        outputVariant: 'success',
        errorVariant: 'error',
        outputDuration: 3000,
        errorDuration: 5000,
        outputTitle: 'Output',
        errorTitle: 'Error',
      },
      ctx: {
        $: 'sess-1',
        client: '',
        project: '',
        directory: '',
        worktree: '',
      },
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    it('calls runScript with script and no arg', async () => {
      mockRunScript.mockResolvedValue({
        output: 'ok',
        error: null,
        exitCode: 0,
      });

      await runScriptAndHandle(baseConfig);

      expect(mockRunScript).toHaveBeenCalledWith('sess-1', 'test.sh');
    });

    it('calls runScript with script and arg when provided', async () => {
      mockRunScript.mockResolvedValue({
        output: 'ok',
        error: null,
        exitCode: 0,
      });

      await runScriptAndHandle({
        ...baseConfig,
        scriptArg: 'myarg',
      });

      expect(mockRunScript).toHaveBeenCalledWith('sess-1', 'test.sh', 'myarg');
    });

    it('returns result from executor', async () => {
      mockRunScript.mockResolvedValue({
        output: 'success output',
        error: null,
        exitCode: 0,
      });

      const result = await runScriptAndHandle(baseConfig);

      expect(result.output).toBe('success output');
    });

    it('uses default sessionId when not provided', async () => {
      mockRunScript.mockResolvedValue({
        output: 'ok',
        error: null,
        exitCode: 0,
      });

      const result = await runScriptAndHandle({
        ...baseConfig,
        sessionId: undefined,
      });

      expect(result.output).toBe('ok');
    });
  });
});
