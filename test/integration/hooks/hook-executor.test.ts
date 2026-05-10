import { describe, it, expect, vi } from 'vitest';
import { HookExecutor } from '.opencode/plugins/features/hooks/hook-executor';
import {
  createToolResolver,
  createEventResolver,
} from '.opencode/plugins/features/events/context';
import { createUserConfig } from 'test/unit/helpers/create-config';
import type { HookExecutorDeps } from '.opencode/plugins/types/executor';
import type {
  ResolvedEventConfig,
  ScriptToastsConfig,
} from '.opencode/plugins/types/config';
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

function createToolSetup(
  depsOverrides?: Partial<HookExecutorDeps>,
  config?: ReturnType<typeof createUserConfig>,
  eventType = 'tool.execute.before',
  toolName = 'bash'
) {
  const deps = createDeps(depsOverrides);
  const executor = new HookExecutor(deps);
  const resolved = createToolResolver(config ?? toastEnabledConfig()).resolve(
    eventType,
    toolName,
    {}
  );
  return { deps, executor, resolved } as const;
}

function createEventSetup(
  config: ReturnType<typeof createUserConfig>,
  eventType: string,
  input: Record<string, unknown> = {},
  depsOverrides?: Partial<HookExecutorDeps>
) {
  const deps = createDeps(depsOverrides);
  const executor = new HookExecutor(deps);
  const resolved = createEventResolver(config).resolve(eventType, input);
  return { deps, executor, resolved } as const;
}

function findToastByTitle(deps: ReturnType<typeof createDeps>, title: string) {
  const calls = vi.mocked(deps.toastQueue.add).mock.calls;
  return calls.find(([t]) => (t.title as string).includes(title));
}

function scriptToastsConfig(
  overrides?: Partial<ScriptToastsConfig>
): ScriptToastsConfig {
  return {
    showOutput: true,
    showError: true,
    outputVariant: 'info',
    errorVariant: 'error',
    outputDuration: 5000,
    errorDuration: 15000,
    outputTitle: 'Script Output',
    errorTitle: 'Script Error',
    ...overrides,
  };
}

function withScripts(
  scripts: { source: string; path: string }[]
): ReturnType<typeof createUserConfig> {
  return createUserConfig({
    default: { toast: true, runScripts: true },
    tools: {
      ...createUserConfig().tools,
      'tool.execute.before': {
        bash: { scripts },
      },
    } as never,
  });
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
    const { deps, executor, resolved } = createToolSetup();
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
      toolName: 'bash',
    });
    expect(deps.toastQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: '====BASH BEFORE====' })
    );
  });

  it('propagates tool.execute.after.bash handler title to toast', async () => {
    const { deps, executor, resolved } = createToolSetup(
      undefined,
      undefined,
      'tool.execute.after',
      'bash'
    );
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.after',
      toolName: 'bash',
    });
    expect(deps.toastQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: '====BASH AFTER====' })
    );
  });

  it('propagates session.created variant and duration from handler', async () => {
    const { deps, executor, resolved } = createEventSetup(
      toastEnabledConfig(),
      'session.created',
      { info: { id: 'ses_123' } }
    );
    await executeEvent(executor, {
      resolved,
      eventType: 'session.created',
      input: { info: { id: 'ses_123' } },
    });
    expect(deps.toastQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success', duration: 10000 })
    );
  });

  it('propagates permission.asked warning variant from handler', async () => {
    const { deps, executor, resolved } = createEventSetup(
      toastEnabledConfig(),
      'permission.asked',
      {}
    );
    await executeEvent(executor, { resolved, eventType: 'permission.asked' });
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
    const { deps, executor, resolved } = createEventSetup(
      withEvents({ unknown: { toast: true } }),
      'unknown',
      {}
    );
    await executeEvent(executor, { resolved, eventType: 'unknown' });
    expect(deps.toastQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: '', variant: 'info', duration: 2000 })
    );
  });

  it('applies toast title override from tool config', async () => {
    const { deps, executor, resolved } = createToolSetup(
      undefined,
      withTools({
        'tool.execute.before': {
          bash: { toast: { title: 'Custom Title' } as never },
        },
      })
    );
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
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
    const { deps, executor, resolved } = createToolSetup();
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
      toolName: 'bash',
    });
    expect(deps.executeScript).toHaveBeenCalledWith(
      {
        source: 'native',
        path: 'tool-execute-before.bash.sh',
        scriptType: 'settings-native',
      },
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
    const { deps, executor, resolved } = createToolSetup({
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('fail.sh', 'error msg', 1)),
    });
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
      toolName: 'bash',
    });
    expect(findToastByTitle(deps, 'Script Error')).toBeDefined();
  });

  it('shows output toast when script succeeds with output', async () => {
    const { deps, executor, resolved } = createToolSetup({
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('ok.sh', 'hello world', 0)),
    });
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
      toolName: 'bash',
    });
    expect(findToastByTitle(deps, 'Script Output')).toBeDefined();
  });

  it('suppresses output toast when scriptToasts.showOutput is false', async () => {
    const { deps, executor, resolved } = createToolSetup(
      {
        executeScript: vi
          .fn()
          .mockResolvedValue(createScriptResult('ok.sh', 'hello', 0)),
      },
      createUserConfig({
        default: { toast: true, runScripts: true },
        scriptToasts: scriptToastsConfig({ showOutput: false }),
      })
    );
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
      toolName: 'bash',
    });
    expect(findToastByTitle(deps, 'Script Output')).toBeUndefined();
  });
});

// ------------------------------------------------------------------------- //
// 5. Multiple Scripts
// ------------------------------------------------------------------------- //
describe('multiple scripts', () => {
  it('executes multiple scripts, one passes one fails', async () => {
    const { deps, executor, resolved } = createToolSetup(
      {
        executeScript: vi
          .fn()
          .mockResolvedValueOnce(createScriptResult('ok.sh', 'success', 0))
          .mockResolvedValueOnce(createScriptResult('fail.sh', 'failure', 1)),
      },
      withScripts([
        { source: 'native', path: 'ok.sh' },
        { source: 'native', path: 'fail.sh' },
      ])
    );
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
      toolName: 'bash',
    });
    expect(deps.executeScript).toHaveBeenCalledTimes(2);
    expect(findToastByTitle(deps, 'Script Error')).toBeDefined();
  });
});

// ------------------------------------------------------------------------- //
// 6. Session Append
// ------------------------------------------------------------------------- //
describe('session append', () => {
  it('appends script output to session when appendToSession is enabled', async () => {
    const { deps, executor, resolved } = createToolSetup(
      {
        executeScript: vi
          .fn()
          .mockResolvedValue(createScriptResult('log.sh', 'session data', 0)),
      },
      createUserConfig({
        default: { toast: false, runScripts: true, appendToSession: true },
      })
    );
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
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
    const { deps, executor, resolved } = createEventSetup(
      withEvents({ 'test.disabled': false }),
      'test.disabled',
      {},
      { logDisabledEvents: true, eventRecorder }
    );

    expect(resolved.enabled).toBe(false);
    await executeEvent(executor, { resolved, eventType: 'test.disabled' });
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
    const { executor, resolved } = createToolSetup({
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('block.sh', 'Blocked', 2)),
    });
    await expect(
      executeEvent(executor, {
        resolved,
        eventType: 'tool.execute.before',
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
    const { executor, resolved } = createEventSetup(
      createUserConfig({ default: { toast: false, runScripts: true } }),
      'session.idle',
      { sessionID: 'ses_123' },
      { stopHook }
    );
    await executeEvent(executor, { resolved, eventType: 'session.idle' });
    expect(stopHook.clearState).toHaveBeenCalledWith('ses_123');
    expect(stopHook.setState).not.toHaveBeenCalled();
  });

  it('sets stop hook state on session.idle with blocking exit code 2', async () => {
    const stopHook = {
      isActive: vi.fn().mockReturnValue(false),
      setState: vi.fn(),
      clearState: vi.fn(),
    };
    const { executor, resolved } = createEventSetup(
      createUserConfig({
        default: { toast: false, runScripts: true },
        events: { 'session.idle': { runScripts: true } } as never,
      }),
      'session.idle',
      { sessionID: 'ses_123' },
      {
        executeScript: vi
          .fn()
          .mockResolvedValue(
            createScriptResult('session-idle.sh', 'blocking content', 2)
          ),
        stopHook,
      }
    );
    await executeEvent(executor, { resolved, eventType: 'session.idle' });
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
    const { executor, resolved } = createToolSetup(
      {
        executeScript: vi
          .fn()
          .mockResolvedValueOnce(createScriptResult('ok.sh', 'output A', 0))
          .mockResolvedValueOnce(createScriptResult('fail.sh', 'output B', 0)),
        scriptRecorder,
      },
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
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
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
    const { deps, executor, resolved } = createToolSetup();
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
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
    const { executor, resolved } = createToolSetup(
      { eventRecorder, logDisabledEvents: false },
      createUserConfig({ default: { toast: false, runScripts: false } })
    );
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
      toolName: 'bash',
    });
    expect(eventRecorder.logEvent).toHaveBeenCalledWith(
      'tool.execute.before',
      expect.objectContaining({ sessionID: 'ses_123', tool: 'bash' })
    );
  });
});

// ------------------------------------------------------------------------- //
// 12. Disabled Event Variants
// ------------------------------------------------------------------------- //
describe('disabled event variants', () => {
  it('skips disabled event silently when logDisabledEvents is false', async () => {
    const eventRecorder = createMockEventRecorder();
    const { deps, executor, resolved } = createEventSetup(
      withEvents({ 'test.silent': false }),
      'test.silent',
      {},
      { logDisabledEvents: false, eventRecorder }
    );
    await executeEvent(executor, { resolved, eventType: 'test.silent' });
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
    const { deps, executor, resolved } = createToolSetup(
      {
        executeScript: vi
          .fn()
          .mockResolvedValue(createScriptResult('empty.sh', '', 0)),
      },
      createUserConfig({
        default: { toast: false, runScripts: true, appendToSession: true },
      })
    );
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
      toolName: 'bash',
    });
    expect(deps.appendToSession).not.toHaveBeenCalled();
  });

  it('does not append when appendToSession is disabled', async () => {
    const { deps, executor, resolved } = createToolSetup(
      {
        executeScript: vi
          .fn()
          .mockResolvedValue(createScriptResult('log.sh', 'data', 0)),
      },
      createUserConfig({
        default: { toast: false, runScripts: true, appendToSession: false },
      })
    );
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
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
    const { deps, executor, resolved } = createToolSetup(
      {
        executeScript: vi
          .fn()
          .mockResolvedValue(
            createScriptResult('fail.sh', 'error occurred', 1)
          ),
      },
      createUserConfig({
        default: { toast: true, runScripts: true },
        scriptToasts: scriptToastsConfig({ showError: false }),
      })
    );
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
      toolName: 'bash',
    });
    expect(findToastByTitle(deps, 'Script Error')).toBeUndefined();
  });
});

// ------------------------------------------------------------------------- //
// 15. SubagentStart (tool.execute.before.subagent)
// ------------------------------------------------------------------------- //
describe('subagent start routing', () => {
  it('executes scripts configured for tool.execute.before.subagent', async () => {
    const { deps, executor, resolved } = createToolSetup(
      {
        executeScript: vi
          .fn()
          .mockResolvedValue(createScriptResult('agent.sh', 'agent start', 0)),
      },
      createUserConfig({
        default: { toast: true, runScripts: true },
        tools: {
          'tool.execute.before': {},
          'tool.execute.before.subagent': {
            task: { scripts: [{ source: 'native', path: 'agent.sh' }] },
          },
        } as never,
      }),
      'tool.execute.before.subagent',
      'task'
    );
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before.subagent',
      toolName: 'task',
      input: { subagentType: 'explore' },
    });
    expect(deps.executeScript).toHaveBeenCalledTimes(1);
  });
});
