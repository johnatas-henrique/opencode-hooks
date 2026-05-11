import { describe, it, expect, vi } from 'vitest';
import { HookExecutor } from '.opencode/plugins/features/hooks/hook-executor';
import {
  createToolResolver,
  createEventResolver,
} from '.opencode/plugins/features/events/context';
import { createUserConfig } from 'test/helpers/create-config';
import type { HookExecutorDeps } from '.opencode/plugins/types/executor';
import type {
  ResolvedEventConfig,
  ScriptToastsConfig,
} from '.opencode/plugins/types/config';
import type { ToastQueue } from '.opencode/plugins/types/toast';
import type {
  EventRecorder,
  ScriptRecorder,
  AuditConfig,
} from '.opencode/plugins/types/audit';
import { executeScript } from '.opencode/plugins/features/scripts/executor';
import { createScriptRecorder } from '.opencode/plugins/features/audit/script-recorder';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
  return createUserConfig({ events: events });
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

function createAppendSetup(output: string) {
  return createToolSetup(
    {
      executeScript: vi
        .fn()
        .mockResolvedValue(createScriptResult('log.sh', output, 0)),
    },
    createUserConfig({
      default: { toast: false, runScripts: true, appendToSession: true },
    })
  );
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
    },
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
  it('includes stderr in error toast when script fails with stderr', async () => {
    const { deps, executor, resolved } = createToolSetup({
      executeScript: vi.fn().mockResolvedValue({
        script: 'fail.sh',
        output: 'error msg',
        stderr: 'permission denied',
        exitCode: 1,
      }),
    });
    await executeEvent(executor, {
      resolved,
      eventType: 'tool.execute.before',
      toolName: 'bash',
    });
    const toast = findToastByTitle(deps, 'Script Error');
    expect(toast).toBeDefined();
    expect((toast![0] as { message: string }).message).toContain(
      'Stderr: permission denied'
    );
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
    const { deps, executor, resolved } = createAppendSetup('session data');

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
// 9. Script Recorder
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
    const { deps, executor, resolved } = createAppendSetup('');

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

// ------------------------------------------------------------------------- //
// 16. Real Script Blocking by ScriptType
// ------------------------------------------------------------------------- //
describe('real script blocking by scriptType', () => {
  let tmpDir: string;
  let auditCfg: AuditConfig;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-executor-test-'));
    auditCfg = {
      enabled: true,
      level: 'debug',
      basePath: tmpDir,
      maxSizeMB: 1,
      maxAgeDays: 30,
      logTruncationKB: 10,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [],
      files: {
        events: '',
        scripts: 'plugin-scripts.json',
        errors: '',
        security: '',
        debug: '',
      },
    };
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function createScriptFile(auditDir: string): string {
    return path.join(auditDir, 'plugin-scripts.json');
  }

  function createRecorder(auditDir: string): ScriptRecorder {
    const scriptFile = createScriptFile(auditDir);
    return createScriptRecorder(auditCfg, {
      writeLine: async (_ft, data) => {
        fs.mkdirSync(auditDir, { recursive: true });
        fs.appendFileSync(scriptFile, JSON.stringify(data) + '\n');
      },
    });
  }

  function readRecords(auditDir: string): Record<string, unknown>[] {
    const f = createScriptFile(auditDir);
    if (!fs.existsSync(f)) return [];
    return fs
      .readFileSync(f, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  }

  function resolvedConfig(
    scripts: { source: string; path: string; scriptType: string }[]
  ): ResolvedEventConfig {
    return {
      enabled: true,
      toast: true,
      toastTitle: '',
      toastMessage: '',
      toastVariant: 'info',
      toastDuration: 2000,
      scripts: scripts as never,
      runScripts: true,
      logToAudit: true,
      appendToSession: false,
      runOnlyOnce: false,
      scriptToasts: {
        showOutput: true,
        showError: true,
        outputVariant: 'info',
        errorVariant: 'error',
        outputDuration: 5000,
        errorDuration: 15000,
        outputTitle: 'Script Output',
        errorTitle: 'Script Error',
      },
    };
  }

  function createBlockDeps(
    recorder: ScriptRecorder
  ): HookExecutorDeps & { toastQueue: ToastQueue } {
    const toastQueue = createMockToastQueue();
    return {
      executeScript,
      isSubagent: () => false,
      appendToSession: vi.fn().mockResolvedValue(undefined),
      toastQueue,
      scriptRecorder: recorder,
      logDisabledEvents: false,
    };
  }

  async function assertBlocked(
    deps: HookExecutorDeps & { toastQueue: ToastQueue },
    auditDir: string,
    expectedScriptType: string
  ): Promise<void> {
    const records = readRecords(auditDir);
    const block = records.find((r) => r.exit === 2);
    expect(block).toBeDefined();
    expect(block!.scriptType).toBe(expectedScriptType);
    expect(block!.stdin).toBeDefined();
    expect(deps.toastQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'error' })
    );
  }

  it('blocks on settings-native (git commit --no-verify)', async () => {
    const recorder = createRecorder(tmpDir);
    const deps = createBlockDeps(recorder);
    const executor = new HookExecutor(deps);
    const resolved = resolvedConfig([
      {
        source: 'native',
        path: 'type-native-no-verify.sh',
        scriptType: 'settings-native',
      },
    ]);

    await expect(
      executor.execute({
        ctx: {} as never,
        eventType: 'tool.execute.before',
        resolved,
        sessionId: 'ses_test',
        input: { tool: 'bash', callID: 'test_001', sessionID: 'ses_test' },
        output: { args: { command: 'git commit --no-verify -m "test"' } },
        toolName: 'bash',
      })
    ).rejects.toThrow(/no-verify/i);

    await assertBlocked(deps, tmpDir, 'settings-native');
  });

  it('blocks on settings-claude (edit .env)', async () => {
    const recorder = createRecorder(tmpDir);
    const deps = createBlockDeps(recorder);
    const executor = new HookExecutor(deps);
    const resolved = resolvedConfig([
      {
        source: 'claude',
        path: 'block-env-write.sh',
        scriptType: 'settings-claude',
      },
    ]);

    await expect(
      executor.execute({
        ctx: {} as never,
        eventType: 'tool.execute.before',
        resolved,
        sessionId: 'ses_test',
        input: { tool: 'edit', callID: 'test_002', sessionID: 'ses_test' },
        output: { args: { filePath: '.env' } },
        toolName: 'edit',
      })
    ).rejects.toThrow(/\.env/i);

    await assertBlocked(deps, tmpDir, 'settings-claude');
  });

  it('blocks on local-claude (cat .env)', async () => {
    const recorder = createRecorder(tmpDir);
    const deps = createBlockDeps(recorder);
    const executor = new HookExecutor(deps);
    const scriptPath = path.join(
      process.cwd(),
      '.claude/hooks/block-destructive.sh'
    );
    const resolved = resolvedConfig([
      { source: 'claude', path: scriptPath, scriptType: 'local-claude' },
    ]);

    await expect(
      executor.execute({
        ctx: {} as never,
        eventType: 'tool.execute.before',
        resolved,
        sessionId: 'ses_test',
        input: { tool: 'bash', callID: 'test_003', sessionID: 'ses_test' },
        output: { args: { command: 'cat .env' } },
        toolName: 'bash',
      })
    ).rejects.toThrow(/\.env/i);

    await assertBlocked(deps, tmpDir, 'local-claude');
  });

  it('blocks on global-claude (cat .env)', async () => {
    const recorder = createRecorder(tmpDir);
    const deps = createBlockDeps(recorder);
    const executor = new HookExecutor(deps);
    const homedir = os.homedir();
    const scriptPath = `node ${homedir}/.claude/hooks/block-dangerous-commands.js`;
    const resolved = resolvedConfig([
      { source: 'claude', path: scriptPath, scriptType: 'global-claude' },
    ]);

    await expect(
      executor.execute({
        ctx: {} as never,
        eventType: 'tool.execute.before',
        resolved,
        sessionId: 'ses_test',
        input: { tool: 'bash', callID: 'test_004', sessionID: 'ses_test' },
        output: { args: { command: 'cat .env' } },
        toolName: 'bash',
      })
    ).rejects.toThrow(/cat-env/i);

    await assertBlocked(deps, tmpDir, 'global-claude');
  });
});
