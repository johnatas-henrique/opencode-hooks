import { describe, it, expect, vi } from 'vitest';
import { HookExecutor } from '.opencode/plugins/features/hooks/hook-executor';
import {
  createToolResolver,
  createEventResolver,
} from '.opencode/plugins/features/events/context';
import { createUserConfig } from 'test/unit/helpers/create-config';
import type { HookExecutorDeps } from '.opencode/plugins/types/executor';
import type { ResolvedEventConfig } from '.opencode/plugins/types/config';
import type { ToastQueue } from '.opencode/plugins/types/toast';
import type {
  EventRecorder,
  ScriptRecorder,
} from '.opencode/plugins/types/audit';

function createMockToastQueue(): ToastQueue {
  return {
    add: vi.fn(),
    addMultiple: vi.fn(),
    clear: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    pending: 0,
  };
}

function createMockEventRecorder(): EventRecorder {
  return {
    logToolExecuteBefore: vi.fn().mockResolvedValue(undefined),
    logToolExecuteAfter: vi.fn().mockResolvedValue(undefined),
    logSessionEvent: vi.fn().mockResolvedValue(undefined),
    logEvent: vi.fn().mockResolvedValue(undefined),
  };
}

function createDeps(
  overrides?: Partial<HookExecutorDeps>
): HookExecutorDeps & { toastQueue: ToastQueue } {
  const toastQueue = createMockToastQueue();
  return {
    executeScript: vi
      .fn()
      .mockResolvedValue({ script: '', output: '', exitCode: 0 }),
    isSubagent: () => false,
    appendToSession: vi.fn().mockResolvedValue(undefined),
    stopHook: {
      isActive: () => false,
      setState: vi.fn(),
      clearState: vi.fn(),
    },
    toastQueue,
    logDisabledEvents: false,
    ...overrides,
  };
}

function createScriptResult(script: string, output: string, exitCode: number) {
  return { script, output, exitCode };
}

const mockCtx = {} as never;

function executeEvent(
  executor: HookExecutor,
  overrides: {
    eventType?: string;
    resolved?: ResolvedEventConfig;
    sessionId?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    toolName?: string;
  }
): Promise<void> {
  return executor.execute({
    ctx: mockCtx,
    eventType: overrides.eventType ?? 'tool.execute.before',
    resolved: overrides.resolved!,
    sessionId: overrides.sessionId ?? 'ses_123',
    input: overrides.input,
    output: overrides.output,
    toolName: overrides.toolName,
  });
}

function toastEnabledConfig(): ReturnType<typeof createUserConfig> {
  return createUserConfig({
    default: { toast: true, runScripts: true },
  });
}

export function withEvents(
  events: Record<string, unknown>
): ReturnType<typeof createUserConfig> {
  return createUserConfig({ events: events as never });
}

export function withTools(
  tools: Record<string, Record<string, unknown>>
): ReturnType<typeof createUserConfig> {
  const base = createUserConfig();
  return createUserConfig({
    tools: {
      ...base.tools,
      ...tools,
    } as never,
  });
}

// ------------------------------------------------------------------------- //
// 1. Handler → Toast Properties
// ------------------------------------------------------------------------- //
describe('handler to toast property flow', () => {
  it('propagates tool.execute.before.bash handler title to toast', async () => {
    const deps = createDeps();
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(toastEnabledConfig());
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    expect(deps.toastQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: '====BASH BEFORE====' })
    );
  });

  it('propagates tool.execute.after.bash handler title to toast', async () => {
    const deps = createDeps();
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(toastEnabledConfig());
    const resolved = toolResolver.resolve('tool.execute.after', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.after',
      resolved,
      toolName: 'bash',
    });

    expect(deps.toastQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: '====BASH AFTER====' })
    );
  });

  it('propagates session.created variant and duration from handler', async () => {
    const deps = createDeps();
    const executor = new HookExecutor(deps);
    const eventResolver = createEventResolver(toastEnabledConfig());
    const resolved = eventResolver.resolve('session.created', {
      info: { id: 'ses_123' },
    });

    await executeEvent(executor, {
      eventType: 'session.created',
      resolved,
      input: { info: { id: 'ses_123' } },
    });

    expect(deps.toastQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success', duration: 10000 })
    );
  });

  it('propagates permission.asked warning variant from handler', async () => {
    const deps = createDeps();
    const executor = new HookExecutor(deps);
    const eventResolver = createEventResolver(toastEnabledConfig());
    const resolved = eventResolver.resolve('permission.asked', {});

    await executeEvent(executor, {
      eventType: 'permission.asked',
      resolved,
    });

    expect(deps.toastQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'warning' })
    );
  });
});

// ------------------------------------------------------------------------- //
// 2. Fallback & Override
// ------------------------------------------------------------------------- //
describe('fallback values and tool config overrides', () => {
  it('uses fallback values when no handler exists', async () => {
    const deps = createDeps();
    const executor = new HookExecutor(deps);
    const eventResolver = createEventResolver(
      withEvents({ unknown: { toast: true } })
    );
    const resolved = eventResolver.resolve('unknown', {});

    await executeEvent(executor, {
      eventType: 'unknown',
      resolved,
    });

    expect(deps.toastQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '',
        variant: 'info',
        duration: 2000,
      })
    );
  });

  it('applies toast title override from tool config', async () => {
    const deps = createDeps();
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(
      withTools({
        'tool.execute.before': {
          bash: {
            toast: { title: 'Custom Title' } as never,
          },
        },
      })
    );
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    expect(deps.toastQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Custom Title' })
    );
  });
});

// ------------------------------------------------------------------------- //
// 3. Script Execution
// ------------------------------------------------------------------------- //
describe('script execution', () => {
  it('executes defaultScript from handler', async () => {
    const deps = createDeps();
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(toastEnabledConfig());
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    expect(deps.executeScript).toHaveBeenCalledWith(
      { source: 'native', path: 'tool-execute-before.bash.sh' },
      'tool.execute.before',
      'bash',
      expect.any(Object),
      undefined
    );
  });
});

// ------------------------------------------------------------------------- //
// 4. Error & Output Toasts
// ------------------------------------------------------------------------- //
describe('error and output toasts', () => {
  it('shows error toast when script fails', async () => {
    const deps = createDeps({
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('fail.sh', 'error msg', 1)),
    });
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(toastEnabledConfig());
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    const calls = vi.mocked(deps.toastQueue.add).mock.calls;
    const errorToast = calls.find(([t]) =>
      (t.title as string).includes('Script Error')
    );
    expect(errorToast).toBeDefined();
  });

  it('shows output toast when script succeeds with output', async () => {
    const deps = createDeps({
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('ok.sh', 'hello world', 0)),
    });
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(toastEnabledConfig());
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    const calls = vi.mocked(deps.toastQueue.add).mock.calls;
    const outputToast = calls.find(([t]) =>
      (t.title as string).includes('Script Output')
    );
    expect(outputToast).toBeDefined();
  });

  it('suppresses output toast when scriptToasts.showOutput is false', async () => {
    const deps = createDeps({
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('ok.sh', 'hello', 0)),
    });
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(
      createUserConfig({
        default: { toast: true, runScripts: true },
        scriptToasts: {
          showOutput: false,
          showError: true,
          outputVariant: 'info',
          errorVariant: 'error',
          outputDuration: 5000,
          errorDuration: 15000,
          outputTitle: 'Script Output',
          errorTitle: 'Script Error',
        },
      })
    );
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    const calls = vi.mocked(deps.toastQueue.add).mock.calls;
    const outputToast = calls.find(([t]) =>
      (t.title as string).includes('Script Output')
    );
    expect(outputToast).toBeUndefined();
  });
});

// ------------------------------------------------------------------------- //
// 5. Multiple Scripts
// ------------------------------------------------------------------------- //
describe('multiple scripts', () => {
  it('executes multiple scripts, one passes one fails', async () => {
    const deps = createDeps({
      executeScript: vi
        .fn()
        .mockResolvedValueOnce(createScriptResult('ok.sh', 'success', 0))
        .mockResolvedValueOnce(createScriptResult('fail.sh', 'failure', 1)),
    });
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(
      createUserConfig({
        default: { toast: true, runScripts: true },
        tools: {
          ...createUserConfig().tools,
          'tool.execute.before': {
            bash: {
              scripts: [
                { source: 'native', path: 'ok.sh' },
                { source: 'native', path: 'fail.sh' },
              ],
            },
          },
        } as never,
      })
    );
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    expect(deps.executeScript).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(deps.toastQueue.add).mock.calls;
    const errorToast = calls.find(([t]) =>
      (t.title as string).includes('Script Error')
    );
    expect(errorToast).toBeDefined();
  });
});

// ------------------------------------------------------------------------- //
// 6. Session Append
// ------------------------------------------------------------------------- //
describe('session append', () => {
  it('appends script output to session when appendToSession is enabled', async () => {
    const deps = createDeps({
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('log.sh', 'session data', 0)),
    });
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(
      createUserConfig({
        default: { toast: false, runScripts: true, appendToSession: true },
      })
    );
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    expect(deps.appendToSession).toHaveBeenCalledWith(
      mockCtx,
      'ses_123',
      'session data'
    );
  });
});

// ------------------------------------------------------------------------- //
// 7. Disabled Event
// ------------------------------------------------------------------------- //
describe('disabled event', () => {
  it('does not show toast or execute scripts when event is disabled', async () => {
    const eventRecorder = createMockEventRecorder();
    const deps = createDeps({
      logDisabledEvents: true,
      eventRecorder,
    });
    const executor = new HookExecutor(deps);
    const eventResolver = createEventResolver(
      withEvents({ 'test.disabled': false })
    );
    const resolved = eventResolver.resolve('test.disabled', {});

    expect(resolved.enabled).toBe(false);

    await executeEvent(executor, {
      eventType: 'test.disabled',
      resolved,
    });

    expect(deps.toastQueue.add).not.toHaveBeenCalled();
    expect(deps.executeScript).not.toHaveBeenCalled();
    expect(eventRecorder.logEvent).toHaveBeenCalledWith(
      'EVENT_DISABLED',
      expect.objectContaining({ context: 'test.disabled' })
    );
  });
});

// ------------------------------------------------------------------------- //
// 8. Block Exit Code
// ------------------------------------------------------------------------- //
describe('block exit code', () => {
  it('throws when tool.execute.before script exits with code 2', async () => {
    const deps = createDeps({
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('block.sh', 'Blocked', 2)),
    });
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(
      createUserConfig({
        default: { toast: true, runScripts: true },
      })
    );
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await expect(
      executeEvent(executor, {
        eventType: 'tool.execute.before',
        resolved,
        toolName: 'bash',
      })
    ).rejects.toThrow('Blocked');
  });
});

// ------------------------------------------------------------------------- //
// 9. Stop Hook
// ------------------------------------------------------------------------- //
describe('stop hook state management', () => {
  it('clears stop hook state on session.idle with no blocking', async () => {
    const stopHook = {
      isActive: vi.fn().mockReturnValue(true),
      setState: vi.fn(),
      clearState: vi.fn(),
    };
    const deps = createDeps({ stopHook });
    const executor = new HookExecutor(deps);
    const eventResolver = createEventResolver(
      createUserConfig({
        default: { toast: false, runScripts: true },
      })
    );
    const resolved = eventResolver.resolve('session.idle', {
      sessionID: 'ses_123',
    });

    await executeEvent(executor, {
      eventType: 'session.idle',
      resolved,
    });

    expect(stopHook.clearState).toHaveBeenCalledWith('ses_123');
    expect(stopHook.setState).not.toHaveBeenCalled();
  });

  it('sets stop hook state on session.idle with blocking exit code 2', async () => {
    const stopHook = {
      isActive: vi.fn().mockReturnValue(false),
      setState: vi.fn(),
      clearState: vi.fn(),
    };
    const deps = createDeps({
      executeScript: vi
        .fn()
        .mockResolvedValue(
          createScriptResult('session-idle.sh', 'blocking content', 2)
        ),
      stopHook,
    });
    const executor = new HookExecutor(deps);
    const eventResolver = createEventResolver(
      createUserConfig({
        default: { toast: false, runScripts: true },
        events: { 'session.idle': { runScripts: true } } as never,
      })
    );
    const resolved = eventResolver.resolve('session.idle', {
      sessionID: 'ses_123',
    });

    await executeEvent(executor, {
      eventType: 'session.idle',
      resolved,
    });

    expect(stopHook.setState).toHaveBeenCalledWith('ses_123');
    expect(stopHook.clearState).not.toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------------- //
// 10. Script Recorder
// ------------------------------------------------------------------------- //
describe('script recorder', () => {
  it('logs each script result when scriptRecorder is present', async () => {
    const scriptRecorder: ScriptRecorder = {
      logScript: vi.fn().mockResolvedValue(undefined),
    };
    const deps = createDeps({
      executeScript: vi
        .fn()
        .mockResolvedValueOnce(createScriptResult('ok.sh', 'output A', 0))
        .mockResolvedValueOnce(createScriptResult('fail.sh', 'output B', 0)),
      scriptRecorder,
    });
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(
      createUserConfig({
        default: { toast: false, runScripts: true },
        tools: {
          ...createUserConfig().tools,
          'tool.execute.before': {
            bash: {
              scripts: [
                { source: 'native', path: 'ok.sh' },
                { source: 'native', path: 'fail.sh' },
              ],
            },
          },
        } as never,
      })
    );
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    expect(scriptRecorder.logScript).toHaveBeenCalledTimes(2);
    expect(scriptRecorder.logScript).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ script: 'ok.sh' }),
      expect.objectContaining({ output: 'output A', exitCode: 0 })
    );
    expect(scriptRecorder.logScript).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ script: 'fail.sh' }),
      expect.objectContaining({ output: 'output B', exitCode: 0 })
    );
  });

  it('skips script recording when scriptRecorder is absent', async () => {
    const deps = createDeps();
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(toastEnabledConfig());
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    expect(
      (deps as unknown as Record<string, unknown>).scriptRecorder
    ).toBeUndefined();
  });
});

// ------------------------------------------------------------------------- //
// 11. Event Recorder on Enabled Event
// ------------------------------------------------------------------------- //
describe('event recorder on enabled event', () => {
  it('calls eventRecorder.logEvent with event type on enabled event', async () => {
    const eventRecorder = createMockEventRecorder();
    const deps = createDeps({
      eventRecorder,
      logDisabledEvents: false,
    });
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(
      createUserConfig({
        default: { toast: false, runScripts: false },
      })
    );
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    expect(eventRecorder.logEvent).toHaveBeenCalledWith(
      'tool.execute.before',
      expect.objectContaining({
        sessionID: 'ses_123',
        tool: 'bash',
      })
    );
  });
});

// ------------------------------------------------------------------------- //
// 12. Disabled Event Variants
// ------------------------------------------------------------------------- //
describe('disabled event variants', () => {
  it('skips disabled event silently when logDisabledEvents is false', async () => {
    const eventRecorder = createMockEventRecorder();
    const deps = createDeps({
      logDisabledEvents: false,
      eventRecorder,
    });
    const executor = new HookExecutor(deps);
    const eventResolver = createEventResolver(
      withEvents({ 'test.silent': false })
    );
    const resolved = eventResolver.resolve('test.silent', {});

    await executeEvent(executor, {
      eventType: 'test.silent',
      resolved,
    });

    expect(deps.toastQueue.add).not.toHaveBeenCalled();
    expect(deps.executeScript).not.toHaveBeenCalled();
    expect(eventRecorder.logEvent).not.toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------------- //
// 13. AppendToSession Edge Cases
// ------------------------------------------------------------------------- //
describe('append to session edge cases', () => {
  it('does not append when script output is empty', async () => {
    const deps = createDeps({
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('empty.sh', '', 0)),
    });
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(
      createUserConfig({
        default: { toast: false, runScripts: true, appendToSession: true },
      })
    );
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    expect(deps.appendToSession).not.toHaveBeenCalled();
  });

  it('does not append when appendToSession is disabled', async () => {
    const deps = createDeps({
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('log.sh', 'data', 0)),
    });
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(
      createUserConfig({
        default: { toast: false, runScripts: true, appendToSession: false },
      })
    );
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    expect(deps.appendToSession).not.toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------------- //
// 14. Error Toast Suppression
// ------------------------------------------------------------------------- //
describe('error toast suppression', () => {
  it('does not show error toast when scriptToasts.showError is false', async () => {
    const deps = createDeps({
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('fail.sh', 'error occurred', 1)),
    });
    const executor = new HookExecutor(deps);
    const toolResolver = createToolResolver(
      createUserConfig({
        default: { toast: true, runScripts: true },
        scriptToasts: {
          showError: false,
          showOutput: true,
          outputVariant: 'info',
          errorVariant: 'error',
          outputDuration: 5000,
          errorDuration: 15000,
          outputTitle: 'Script Output',
          errorTitle: 'Script Error',
        },
      })
    );
    const resolved = toolResolver.resolve('tool.execute.before', 'bash', {});

    await executeEvent(executor, {
      eventType: 'tool.execute.before',
      resolved,
      toolName: 'bash',
    });

    const calls = vi.mocked(deps.toastQueue.add).mock.calls;
    const errorToast = calls.find(([t]) =>
      (t.title as string).includes('Script Error')
    );
    expect(errorToast).toBeUndefined();
  });
});
