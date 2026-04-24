import { createScriptRunner } from '../../.opencode/plugins/features/scripts/script-runner';
import type { PluginInput } from '@opencode-ai/plugin';
import type {
  ResolvedEventConfig,
  ScriptToastsConfig,
} from '../../.opencode/plugins/types/config';
import type { ScriptRecorder } from '../../.opencode/plugins/types/audit';
import type { EventScriptConfig } from '../../.opencode/plugins/types/scripts';
import { vi } from 'vitest';

type HandlerConfig = EventScriptConfig & { scriptRecorder?: ScriptRecorder };

vi.mock('../../.opencode/plugins/features/scripts/run-script-handler', () => ({
  runScriptAndHandle: vi.fn(),
}));
import { runScriptAndHandle } from '../../.opencode/plugins/features/scripts/run-script-handler';

const mockedRunScriptAndHandle = vi.mocked(runScriptAndHandle, true);

describe('createScriptRunner', () => {
  // Minimal valid PluginInput using cast to satisfy type system
  const mockCtx = {
    $: async () => ({ exitCode: 0, stdout: '', stderr: '' }),
    client: { tui: { showToast: () => {} }, session: { prompt: () => {} } },
    project: '',
    directory: '',
    worktree: '',
    serverUrl: '',
    experimental_workspace: undefined,
  } as unknown as PluginInput;

  const mockRecorder: ScriptRecorder = {
    logScript: vi.fn(),
  };

  const mockResolved: ResolvedEventConfig = {
    enabled: true,
    debug: false,
    toast: true,
    toastTitle: 'Test',
    toastMessage: '',
    toastVariant: 'info',
    toastDuration: 3000,
    scripts: ['test.sh'],
    runScripts: true,
    logToAudit: true,
    appendToSession: true,
    runOnlyOnce: false,
    scriptToasts: {
      showOutput: false,
      showError: true,
      outputVariant: 'success',
      errorVariant: 'error',
      outputDuration: 2000,
      errorDuration: 5000,
      outputTitle: 'Output',
      errorTitle: 'ERROR',
    },
    allowedFields: [],
    block: [],
  };

  const mockScriptToasts: ScriptToastsConfig = mockResolved.scriptToasts;

  const deps = {
    ctx: mockCtx,
    sessionId: 'test-session',
    eventType: 'session.created',
    resolved: mockResolved,
    scriptToasts: mockScriptToasts,
    scriptRecorder: mockRecorder,
    toolName: 'test-tool',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedRunScriptAndHandle.mockResolvedValue({
      script: 'test.sh',
      output: 'ok',
    });
  });

  it('should call runScriptAndHandle with correct config', async () => {
    const runner = createScriptRunner(deps);
    const result = await runner('test.sh', 'arg1');

    expect(mockedRunScriptAndHandle).toHaveBeenCalledTimes(1);
    const passedConfig = mockedRunScriptAndHandle.mock
      .calls[0][0] as HandlerConfig;

    expect(passedConfig.ctx).toBe(mockCtx);
    expect(passedConfig.script).toBe('test.sh');
    expect(passedConfig.scriptArg).toBe('arg1');
    expect(passedConfig.eventType).toBe('session.created');
    expect(passedConfig.toolName).toBe('test-tool');
    expect(passedConfig.sessionId).toBe('test-session');
    expect(passedConfig.resolved).not.toBe(deps.resolved);
    expect(passedConfig.scriptToasts).not.toBe(deps.scriptToasts);
    expect(result).toEqual({ script: 'test.sh', output: 'ok' });
  });

  it('should set suppressToast option by changing showError', async () => {
    const runner = createScriptRunner(deps);
    await runner('test.sh', undefined, { suppressToast: true });

    const passedConfig = mockedRunScriptAndHandle.mock
      .calls[0][0] as HandlerConfig;
    expect(passedConfig.scriptToasts.showError).toBe(false);
    expect(passedConfig.scriptToasts.showOutput).toBe(
      mockScriptToasts.showOutput
    );
  });

  it('should set skipAudit option by setting logToAudit false', async () => {
    const runner = createScriptRunner(deps);
    await runner('test.sh', undefined, { skipAudit: true });

    const passedConfig = mockedRunScriptAndHandle.mock
      .calls[0][0] as HandlerConfig;
    expect(passedConfig.resolved.logToAudit).toBe(false);
  });

  it('should set skipSession option by setting appendToSession false', async () => {
    const runner = createScriptRunner(deps);
    await runner('test.sh', undefined, { skipSession: true });

    const passedConfig = mockedRunScriptAndHandle.mock
      .calls[0][0] as HandlerConfig;
    expect(passedConfig.resolved.appendToSession).toBe(false);
  });

  it('should override runOnlyOnce flag', async () => {
    const runner = createScriptRunner(deps);
    await runner('test.sh', undefined, { runOnlyOnce: true });

    const passedConfig = mockedRunScriptAndHandle.mock
      .calls[0][0] as HandlerConfig;
    expect(passedConfig.resolved.runOnlyOnce).toBe(true);
  });

  it('should combine multiple options', async () => {
    const runner = createScriptRunner(deps);
    await runner('test.sh', 'arg', {
      suppressToast: true,
      skipAudit: true,
      runOnlyOnce: false,
    });

    const passedConfig = mockedRunScriptAndHandle.mock
      .calls[0][0] as HandlerConfig;
    expect(passedConfig.scriptToasts.showError).toBe(false);
    expect(passedConfig.resolved.logToAudit).toBe(false);
    expect(passedConfig.resolved.runOnlyOnce).toBe(false);
    expect(passedConfig.resolved.appendToSession).toBe(true);
  });

  it('should pass scriptRecorder from deps to handler', async () => {
    const runner = createScriptRunner(deps);
    await runner('test.sh');

    const callArg = mockedRunScriptAndHandle.mock.calls[0][0] as HandlerConfig;
    expect(callArg.scriptRecorder).toBe(mockRecorder);
  });

  it('should work without scriptRecorder in deps', async () => {
    const depsNoRecorder = { ...deps, scriptRecorder: undefined };
    const runner = createScriptRunner(depsNoRecorder);
    await runner('test.sh');

    const callArg = mockedRunScriptAndHandle.mock.calls[0][0] as HandlerConfig;
    expect(callArg.scriptRecorder).toBeUndefined();
  });

  it('should use Date.now().toString() for timestamp', async () => {
    const runner = createScriptRunner(deps);
    const mockNow = 1234567890000;
    vi.spyOn(Date, 'now').mockReturnValue(mockNow);

    await runner('test.sh');

    const passedConfig = mockedRunScriptAndHandle.mock
      .calls[0][0] as HandlerConfig;
    expect(passedConfig.timestamp).toBe(mockNow.toString());

    vi.restoreAllMocks();
  });
});
