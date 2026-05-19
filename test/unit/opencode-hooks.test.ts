import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ResolvedEventConfig } from '.opencode/plugins/types/config';
import type { Hooks } from '@opencode-ai/plugin';
import type { Event, UserMessage, Model, Provider } from '@opencode-ai/sdk';
import type { ChildProcess } from 'child_process';
import { spawn } from 'child_process';
import { fromAny } from '@total-typescript/shoehorn';
import { makeMockChildProcess } from '../helpers/mock-child-process';
import * as startupToastModule from '.opencode/plugins/features/messages/show-startup-toast';
import * as runtimeModule from '.opencode/plugins/config/runtime';
import * as executorModule from '.opencode/plugins/features/scripts/executor';
import * as appendToSessionModule from '.opencode/plugins/features/messages/append-to-session';
import fs from 'fs';

vi.mock('fs', async () => {
  const { createSyncMockFs } = await import('../helpers/mock-fs');
  const mockFsObj = createSyncMockFs();
  return { ...mockFsObj, default: mockFsObj };
});

vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockRejectedValue(new Error('not found')),
  appendFile: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
  unlink: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('child_process', async () => {
  const { makeMockChildProcess } =
    await import('../helpers/mock-child-process');
  return { spawn: vi.fn(() => makeMockChildProcess()) };
});

vi.mock('.opencode/plugins/config/runtime', async () => {
  const { createMockSettings } = await import('../helpers/mock-settings');
  const mockSettings = createMockSettings();
  mockSettings.userConfig.toastQueue = { staggerMs: 300, maxSize: 50 };
  Object.assign(mockSettings.userConfig.scriptToasts, {
    showOutput: true,
    showError: true,
    outputVariant: 'warning',
    errorVariant: 'error',
    outputDuration: 5000,
    errorDuration: 15000,
    outputTitle: '- SCRIPTS OUTPUT',
    errorTitle: '- SCRIPT ERROR',
  });
  Object.assign(mockSettings.userConfig.audit, {
    basePath: './production/session-logs',
    maxSizeMB: 1,
    maxAgeDays: 30,
    logTruncationKB: 2,
    files: {
      events: 'plugin-events.json',
      scripts: 'plugin-scripts.json',
      errors: 'plugin-errors.json',
      security: 'plugin-security.json',
      debug: 'plugin-debug.json',
    },
  });
  return mockSettings;
});

vi.mock('.opencode/plugins/features/scripts/executor', async () => {
  const { createExecutorMock } = await import('../helpers/mock-executor');
  return createExecutorMock();
});

vi.mock('.opencode/plugins/features/messages/append-to-session', () => ({
  appendToSession: vi.fn().mockResolvedValue(undefined),
}));

import * as eventsModule from '.opencode/plugins/features/events/events';
import * as pluginIntegration from '.opencode/plugins/features/audit/plugin-integration';
import { addSubagentSession } from '.opencode/plugins/features/scripts/run-script-handler';
import {
  resetGlobalToastQueue,
  useGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';
import { OpencodeHooks } from '.opencode/plugins/opencode-hooks';

function createMockResolvedConfig(
  overrides?: Partial<ResolvedEventConfig>
): ResolvedEventConfig {
  return {
    enabled: true,
    toast: false,
    toastTitle: '',
    toastMessage: '',
    toastVariant: 'info',
    toastDuration: 2000,
    scripts: [],
    runScripts: false,
    runOnlyOnce: false,
    logToAudit: true,
    appendToSession: false,
    scriptToasts: {
      showOutput: false,
      showError: false,
      outputVariant: 'info',
      errorVariant: 'error',
      outputDuration: 5000,
      errorDuration: 15000,
      outputTitle: 'Script Output',
      errorTitle: 'Script Error',
    },
    ...overrides,
  };
}

const mockCtx = {
  client: {
    tui: { showToast: vi.fn() },
    session: { prompt: vi.fn() },
  },
};

function setupCommonMocks(): void {
  vi.mocked(runtimeModule).userConfig.enabled = true;
  vi.mocked(runtimeModule).userConfig.logDisabledEvents = false;
  vi.mocked(fs).existsSync.mockImplementation(((path: string) => {
    if (path.includes('.opencode/scripts')) return true;
    return false;
  }) as (...args: unknown[]) => boolean);
  vi.mocked(fs).statSync.mockReturnValue(
    fromAny({ isDirectory: () => true, size: 0 })
  );
  vi.mocked(fs).readdirSync.mockReturnValue([]);
  vi.mocked(fs).readFileSync.mockReturnValue('');
  vi.mocked(fs).appendFileSync = vi.fn();
  vi.mocked(fs).writeFileSync = vi.fn();
  vi.mocked(fs).mkdirSync = vi.fn();
  vi.mocked(fs).unlinkSync = vi.fn();
  vi.mocked(spawn).mockImplementation(() =>
    fromAny<ChildProcess, unknown>(makeMockChildProcess())
  );
}

function setupHooks(): Promise<Hooks> {
  resetGlobalToastQueue();
  pluginIntegration.resetAuditLogging();
  setupGlobalRecorders();
  setupCommonMocks();
  return OpencodeHooks(mockCtx as never);
}

function createEventInput(
  eventType = 'session.created',
  sessionId = 'ses_123'
) {
  return {
    event: {
      type: eventType,
      properties: { info: { id: sessionId } },
    } as Event,
  };
}

function mockResolveEventConfig(overrides?: Partial<ResolvedEventConfig>) {
  return vi
    .spyOn(eventsModule, 'resolveEventConfig')
    .mockReturnValue(createMockResolvedConfig(overrides ?? { enabled: false }));
}

function mockResolveToolConfig(overrides?: Partial<ResolvedEventConfig>) {
  return vi
    .spyOn(eventsModule, 'resolveToolConfig')
    .mockReturnValue(createMockResolvedConfig(overrides ?? { enabled: false }));
}

function setupGlobalRecorders(): void {
  (globalThis as Record<string, unknown>).__opencode_debug_recorder = {
    logDebug: vi.fn(),
  };
  (globalThis as Record<string, unknown>).__opencode_security_recorder = {
    logSecurity: vi.fn(),
  };
}

function mockToastAdd() {
  return vi.spyOn(useGlobalToastQueue(), 'add').mockImplementation(() => {});
}

let hooks: Hooks;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  resetGlobalToastQueue();
});

describe('OpencodeHooks initialization', () => {
  afterEach(() => {
    vi.useRealTimers();
    resetGlobalToastQueue();
  });

  it('shows startup toast on first call only', async () => {
    vi.useFakeTimers();
    pluginIntegration.resetAuditLogging();
    setupCommonMocks();
    setupGlobalRecorders();

    const showSpy = vi.spyOn(startupToastModule, 'showStartupToast');

    const first = OpencodeHooks(mockCtx as never);
    await vi.advanceTimersByTimeAsync(10000);
    await first;

    expect(showSpy).toHaveBeenCalledOnce();

    const second = OpencodeHooks(mockCtx as never);
    await vi.advanceTimersByTimeAsync(10000);
    const secondHooks = await second;
    expect(secondHooks).toBeDefined();
    expect(showSpy).toHaveBeenCalledTimes(1);
  });

  it('returns empty hooks when plugin is disabled', async () => {
    vi.mocked(runtimeModule).userConfig.enabled = false;
    const result = await OpencodeHooks(mockCtx as never);
    expect(result).toEqual({});
  });

  it('detects and logs malformed Claude settings JSON during init', async () => {
    vi.mocked(runtimeModule).userConfig.loadClaudeHookSettings = {
      loadGlobalClaudeHooks: true,
      loadLocalClaudeHooks: false,
    };

    resetGlobalToastQueue();
    pluginIntegration.resetAuditLogging();
    setupCommonMocks();
    setupGlobalRecorders();

    vi.mocked(fs).existsSync.mockImplementation(((p: string) => {
      if (p.includes('.opencode/scripts')) return true;
      if (p.includes('.claude/settings.json')) return true;
      return false;
    }) as (...args: unknown[]) => boolean);

    vi.mocked(fs).readFileSync.mockImplementation(((p: string) => {
      if (p.includes('.claude/settings.json')) return '{ invalid json }';
      return '';
    }) as (...args: unknown[]) => string);

    const logError = vi.fn();
    vi.spyOn(pluginIntegration, 'getErrorRecorder').mockReturnValue({
      logError,
    });

    const hooksPromise = OpencodeHooks(mockCtx as never);

    const toastAddSpy = vi
      .spyOn(useGlobalToastQueue(), 'add')
      .mockImplementation(() => {});

    await vi.advanceTimersByTimeAsync(10000);
    await hooksPromise;

    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Malformed JSON'),
        context: 'loadClaudeSettings',
      })
    );
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Claude Settings Error',
        variant: 'error',
      })
    );
  });
});

describe('hooks structure', () => {
  beforeEach(async () => {
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  it('returns Hooks object with expected keys', () => {
    expect(hooks).toHaveProperty('event');
    expect(hooks).toHaveProperty('tool.execute.before');
    expect(hooks).toHaveProperty('tool.execute.after');
    expect(hooks).toHaveProperty('shell.env');
    expect(hooks).toHaveProperty('chat.message');
    expect(hooks).toHaveProperty('chat.params');
    expect(hooks).toHaveProperty('chat.headers');
    expect(hooks).toHaveProperty('permission.ask');
    expect(hooks).toHaveProperty('command.execute.before');
    expect(hooks).toHaveProperty('experimental.chat.messages.transform');
    expect(hooks).toHaveProperty('experimental.chat.system.transform');
    expect(hooks).toHaveProperty('experimental.session.compacting');
    expect(hooks).toHaveProperty('experimental.text.complete');
    expect(hooks).toHaveProperty('tool.definition');
    expect(hooks).toHaveProperty('config');
    expect(hooks).toHaveProperty('auth');
    expect(hooks).toHaveProperty('tool');
  });
});

describe('event handler', () => {
  beforeEach(async () => {
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  it('calls resolveEventConfig with event type and properties', async () => {
    const resolveSpy = vi.spyOn(eventsModule, 'resolveEventConfig');

    await hooks.event!(createEventInput());

    expect(resolveSpy).toHaveBeenCalledWith('session.created', {
      info: { id: 'ses_123' },
    });
  });

  it('calls addSubagentSession when session.created has parentID', async () => {
    const addSpy = vi.spyOn(
      await import('.opencode/plugins/features/scripts/run-script-handler'),
      'addSubagentSession'
    );

    await hooks.event!({
      event: {
        type: 'session.created',
        properties: {
          info: { id: 'ses_child', parentID: 'ses_parent' },
        },
      } as Event,
    });

    expect(addSpy).toHaveBeenCalledWith('ses_child');
  });

  it('logs unknown event types via getEventRecorder', async () => {
    const logEventSpy = vi
      .spyOn(pluginIntegration.getEventRecorder()!, 'logEvent')
      .mockResolvedValue(undefined);

    await hooks.event!({
      event: fromAny<Event, unknown>({
        type: 'unknown.test' as const,
        properties: {},
      }),
    });

    expect(logEventSpy).toHaveBeenCalledWith('UNKNOWN_EVENT', {
      sessionID: 'unknown',
      input: { event: { type: 'unknown.test', properties: {} } },
    });
  });

  it('does not log UNKNOWN_EVENT when event is in userConfig.events even without handler', async () => {
    const logEventSpy = vi
      .spyOn(pluginIntegration.getEventRecorder()!, 'logEvent')
      .mockResolvedValue(undefined);

    (vi.mocked(runtimeModule).userConfig.events as Record<string, unknown>)[
      'config.only.event'
    ] = { enabled: false };

    await hooks.event!({
      event: fromAny<Event, unknown>({
        type: 'config.only.event',
        properties: {},
      }),
    });

    expect(logEventSpy).not.toHaveBeenCalledWith(
      'UNKNOWN_EVENT',
      expect.anything()
    );
  });

  it('stops execution when runOnlyOnce and isSubagent', async () => {
    addSubagentSession('ses_sub');

    mockResolveEventConfig({ runOnlyOnce: true });

    await hooks.event!(createEventInput('session.created', 'ses_sub'));

    expect(hooks).toBeDefined();
  });

  it('shows toast when resolved config has toast enabled', async () => {
    const addSpy = mockToastAdd();

    mockResolveEventConfig({
      toast: true,
      toastTitle: 'Test Toast',
      toastMessage: 'Test message',
      toastVariant: 'info',
      toastDuration: 5000,
      scripts: [],
    });

    await hooks.event!(createEventInput());

    expect(addSpy).toHaveBeenCalled();
  });

  it('logs disabled event when logDisabledEvents is true', async () => {
    vi.mocked(runtimeModule).userConfig.logDisabledEvents = true;
    const logEventSpy = vi
      .spyOn(pluginIntegration.getEventRecorder()!, 'logEvent')
      .mockResolvedValue(undefined);

    mockResolveEventConfig();

    await hooks.event!(createEventInput());

    expect(logEventSpy).toHaveBeenCalledWith('EVENT_DISABLED', {
      sessionID: 'ses_123',
      context: 'session.created',
    });
  });

  it('does not call getEventRecorder when logDisabledEvents is false', async () => {
    const resolveSpy = mockResolveEventConfig();

    await hooks.event!(createEventInput());

    expect(resolveSpy).toHaveBeenCalled();
  });

  it('extracts sessionId from info.id for session events', async () => {
    const resolveSpy = mockResolveEventConfig();

    await hooks.event!(createEventInput('session.created', 'ses_custom'));

    expect(resolveSpy).toHaveBeenCalled();
  });

  it('falls back to default sessionId when none provided', async () => {
    const resolveSpy = mockResolveEventConfig();

    await hooks.event!({
      event: {
        type: 'session.created',
        properties: { info: {} },
      } as Event,
    });

    expect(resolveSpy).toHaveBeenCalled();
  });
});

describe('tool.execute.before handler', () => {
  beforeEach(async () => {
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  it('calls resolveToolConfig with tool name and args', async () => {
    const resolveSpy = mockResolveToolConfig();

    const input = {
      tool: 'bash',
      sessionID: 'ses_123',
      callID: 'call_1',
      args: { command: 'ls -la' },
    };
    const output = {};

    await hooks['tool.execute.before']!(input, output as never);

    expect(resolveSpy).toHaveBeenCalledWith(
      'tool.execute.before',
      'bash',
      input,
      output
    );
  });

  it('throws block error when script exits with code 2', async () => {
    vi.mocked(executorModule).executeScript.mockResolvedValue({
      script: 'block.sh',
      output: 'Blocked by policy',
      exitCode: 2,
    });

    mockResolveToolConfig({
      runScripts: true,
      scripts: [{ source: 'native' as const, path: 'block.sh' }],
    });

    const input = {
      tool: 'bash',
      sessionID: 'ses_123',
      callID: 'call_1',
      args: { command: 'ls' },
    };

    await expect(
      hooks['tool.execute.before']!(input, {} as never)
    ).rejects.toThrow('Blocked by policy');
  });

  it('resolves as subagent when task tool has subagent_type', async () => {
    const resolveSpy = mockResolveToolConfig();

    await hooks['tool.execute.before']!(
      { tool: 'task', sessionID: 'ses_123', callID: 'call_1' },
      { args: { subagent_type: 'explore', description: 'test' } }
    );

    expect(resolveSpy).toHaveBeenCalledWith(
      'tool.execute.before.subagent',
      'task',
      expect.objectContaining({ subagentType: 'explore' }),
      { args: { subagent_type: 'explore', description: 'test' } }
    );
  });

  it('resolves as regular before for non-task tools', async () => {
    const resolveSpy = mockResolveToolConfig();

    await hooks['tool.execute.before']!(
      { tool: 'bash', sessionID: 'ses_123', callID: 'call_1' },
      { args: { command: 'ls' } }
    );

    expect(resolveSpy).toHaveBeenCalledWith(
      'tool.execute.before',
      'bash',
      { tool: 'bash', sessionID: 'ses_123', callID: 'call_1' },
      { args: { command: 'ls' } }
    );
  });

  it('resolves as regular before for task without subagent_type', async () => {
    const resolveSpy = mockResolveToolConfig();

    await hooks['tool.execute.before']!(
      { tool: 'task', sessionID: 'ses_123', callID: 'call_1' },
      { args: { command: '/check-file', prompt: 'check it' } }
    );

    expect(resolveSpy).toHaveBeenCalledWith(
      'tool.execute.before',
      'task',
      expect.objectContaining({ subagentType: '' }),
      { args: { command: '/check-file', prompt: 'check it' } }
    );
  });
});

describe('tool.execute.after handler', () => {
  beforeEach(async () => {
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  it('resolves as subagent when task tool has subagent_type', async () => {
    const resolveSpy = mockResolveToolConfig();

    await hooks['tool.execute.after']!(
      {
        tool: 'task',
        sessionID: 'ses_123',
        callID: 'call_1',
        args: { subagent_type: 'explore', description: 'test' },
      },
      {} as never
    );

    expect(resolveSpy).toHaveBeenCalledWith(
      'tool.execute.after.subagent',
      'task',
      expect.objectContaining({ subagentType: 'explore' }),
      {}
    );
  });

  it('resolves as regular after handler for non-task tools', async () => {
    const resolveSpy = mockResolveToolConfig();

    await hooks['tool.execute.after']!(
      {
        tool: 'bash',
        sessionID: 'ses_123',
        callID: 'call_1',
        args: { command: 'ls' },
      },
      {} as never
    );

    expect(resolveSpy).toHaveBeenCalledWith(
      'tool.execute.after',
      'bash',
      expect.objectContaining({ skillType: '' }),
      {}
    );
  });

  it('sets skillType for skill tool', async () => {
    const resolveSpy = mockResolveToolConfig();

    await hooks['tool.execute.after']!(
      {
        tool: 'skill',
        sessionID: 'ses_123',
        callID: 'call_1',
        args: { name: 'test-skill' },
      },
      {} as never
    );

    expect(resolveSpy).toHaveBeenCalledWith(
      'tool.execute.after',
      'skill',
      expect.objectContaining({ skillType: 'test-skill' }),
      {}
    );
  });

  it('handles task tool without subagent_type in after', async () => {
    const resolveSpy = mockResolveToolConfig();

    await hooks['tool.execute.after']!(
      {
        tool: 'task',
        sessionID: 'ses_123',
        callID: 'call_1',
        args: { command: 'ls' },
      },
      {} as never
    );

    expect(resolveSpy).toHaveBeenCalledWith(
      'tool.execute.after',
      'task',
      expect.objectContaining({ subagentType: '' }),
      {}
    );
  });

  it('handles skill tool without name', async () => {
    const resolveSpy = mockResolveToolConfig();

    await hooks['tool.execute.after']!(
      {
        tool: 'skill',
        sessionID: 'ses_123',
        callID: 'call_1',
        args: {},
      },
      {} as never
    );

    expect(resolveSpy).toHaveBeenCalledWith(
      'tool.execute.after',
      'skill',
      expect.objectContaining({ skillType: '' }),
      {}
    );
  });
});

describe('shell.env handler', () => {
  beforeEach(async () => {
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  it('calls resolveEventConfig', async () => {
    const resolveSpy = mockResolveEventConfig();

    await hooks['shell.env']!(
      { cwd: '/test', sessionID: 'ses_123' },
      { env: { PATH: '/usr/bin' } }
    );

    expect(resolveSpy).toHaveBeenCalledWith('shell.env', {
      cwd: '/test',
      sessionID: 'ses_123',
    });
  });
});

describe('chat.message handler', () => {
  beforeEach(async () => {
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  it('calls resolveEventConfig', async () => {
    const resolveSpy = mockResolveEventConfig();

    await hooks['chat.message']!(
      {
        sessionID: 'ses_123',
        agent: 'test-agent',
        model: { providerID: 'anthropic', modelID: 'claude-3' },
      },
      { message: {} as unknown as UserMessage, parts: [] }
    );

    expect(resolveSpy).toHaveBeenCalledWith('chat.message', {
      sessionID: 'ses_123',
      agent: 'test-agent',
      model: { providerID: 'anthropic', modelID: 'claude-3' },
    });
  });
});

describe('executeHook behavior', () => {
  beforeEach(async () => {
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  beforeEach(() => {
    vi.mocked(executorModule).executeScript.mockReset();
    vi.mocked(executorModule).executeScript.mockResolvedValue({
      script: '',
      output: '',
      exitCode: 0,
    });
    vi.mocked(appendToSessionModule).appendToSession.mockReset();
    vi.mocked(appendToSessionModule).appendToSession.mockResolvedValue(
      undefined
    );
  });

  it('executes scripts from resolved config', async () => {
    mockResolveEventConfig({
      runScripts: true,
      scripts: [{ source: 'native' as const, path: 'test.sh' }],
    });

    await hooks.event!(createEventInput());

    expect(vi.mocked(executorModule).executeScript).toHaveBeenCalledWith(
      { source: 'native', path: 'test.sh' },
      'session.created',
      '',
      expect.any(Object),
      undefined
    );
  });

  it('appends to session when appendToSession is enabled', async () => {
    vi.mocked(executorModule).executeScript.mockResolvedValue({
      script: 'test.sh',
      output: 'session data',
      exitCode: 0,
    });

    mockResolveEventConfig({
      runScripts: true,
      appendToSession: true,
      scripts: [{ source: 'native' as const, path: 'test.sh' }],
    });

    await hooks.event!(createEventInput());

    expect(
      vi.mocked(appendToSessionModule).appendToSession
    ).toHaveBeenCalledWith(mockCtx, 'ses_123', 'session data');
  });

  it('logs scripts via scriptRecorder', async () => {
    const logScriptSpy = vi
      .spyOn(pluginIntegration.getScriptRecorder()!, 'logScript')
      .mockResolvedValue(undefined);

    mockResolveEventConfig({
      runScripts: true,
      scripts: [{ source: 'native' as const, path: 'test.sh' }],
    });

    await hooks.event!(createEventInput());

    expect(logScriptSpy).toHaveBeenCalled();
  });

  it('shows error toast when scripts fail and showError is true', async () => {
    const addSpy = mockToastAdd();

    vi.mocked(executorModule).executeScript.mockResolvedValue({
      script: 'fail.sh',
      output: 'Script failed',
      exitCode: 1,
    });

    mockResolveEventConfig({
      toast: true,
      toastTitle: '====ERROR====',
      toastMessage: 'test',
      toastVariant: 'error',
      toastDuration: 15000,
      runScripts: true,
      scripts: [{ source: 'native' as const, path: 'fail.sh' }],
      scriptToasts: {
        showOutput: false,
        showError: true,
        outputVariant: 'warning',
        errorVariant: 'error',
        outputDuration: 5000,
        errorDuration: 15000,
        outputTitle: '- OUTPUT',
        errorTitle: '- SCRIPT ERROR',
      },
    });

    await hooks.event!(createEventInput());

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('SCRIPT ERROR'),
      })
    );
  });

  it('executes scripts for session.idle', async () => {
    mockResolveEventConfig({
      runScripts: true,
      scripts: [{ source: 'native' as const, path: 'idle.sh' }],
    });

    await hooks.event!({
      event: {
        type: 'session.idle',
        properties: { sessionID: 'ses_123' },
      },
    });

    expect(vi.mocked(executorModule).executeScript).toHaveBeenCalledWith(
      { source: 'native', path: 'idle.sh' },
      'session.idle',
      '',
      expect.any(Object),
      undefined
    );
  });

  it('shows script output toast when configured', async () => {
    const addSpy = mockToastAdd();

    vi.mocked(executorModule).executeScript.mockResolvedValue({
      script: 'test.sh',
      output: 'hello world',
      exitCode: 0,
    });

    mockResolveEventConfig({
      toast: true,
      toastTitle: '====TOAST====',
      toastMessage: 'test',
      toastVariant: 'info',
      toastDuration: 5000,
      runScripts: true,
      scripts: [{ source: 'native' as const, path: 'test.sh' }],
      scriptToasts: {
        showOutput: true,
        showError: false,
        outputVariant: 'warning',
        errorVariant: 'error',
        outputDuration: 5000,
        errorDuration: 15000,
        outputTitle: '- SCRIPTS OUTPUT',
        errorTitle: '- SCRIPT ERROR',
      },
    });

    await hooks.event!(createEventInput());

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('SCRIPTS OUTPUT'),
      })
    );
  });

  it('handles toast dropped via onToastDropped callback', async () => {
    vi.mocked(runtimeModule).userConfig.toastQueue.maxSize = 2;
    vi.spyOn(pluginIntegration, 'getErrorRecorder').mockReturnValue(undefined);

    resetGlobalToastQueue();
    pluginIntegration.resetAuditLogging();
    setupGlobalRecorders();
    setupCommonMocks();
    const localHooks = await OpencodeHooks(mockCtx as never);
    await vi.advanceTimersByTimeAsync(300);

    const q = useGlobalToastQueue();
    q.add(fromAny({ title: 't1', variant: 'info', message: 'm1' }));
    q.add(fromAny({ title: 't2', variant: 'info', message: 'm2' }));
    q.add(fromAny({ title: 't3', variant: 'info', message: 'm3' }));

    expect(localHooks).toBeDefined();
  });

  it('uses fallback title in dropped toast when title is empty', async () => {
    vi.mocked(runtimeModule).userConfig.toastQueue.maxSize = 2;

    resetGlobalToastQueue();
    pluginIntegration.resetAuditLogging();
    setupGlobalRecorders();
    setupCommonMocks();
    await OpencodeHooks(mockCtx as never);
    await vi.advanceTimersByTimeAsync(300);

    const logError = vi.fn();
    vi.spyOn(pluginIntegration, 'getErrorRecorder').mockReturnValue({
      logError,
    });

    const q = useGlobalToastQueue();
    q.add(fromAny({ title: '', variant: 'info', message: 'm1', duration: 1 }));
    q.add(
      fromAny({ title: 't2', variant: 'info', message: 'm2', duration: 1 })
    );
    q.add(
      fromAny({ title: 't3', variant: 'info', message: 'm3', duration: 1 })
    );

    expect(logError).toHaveBeenCalledWith({
      message: 'Toast dropped: (no title)',
      context: expect.any(String),
    });
  });
});

describe('config handler', () => {
  beforeEach(async () => {
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  it('is a function and can be called', async () => {
    await hooks.config!({});
    expect(typeof hooks.config).toBe('function');
  });
});

describe('auth hook', () => {
  beforeEach(async () => {
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  it('returns auth structure', () => {
    expect(hooks.auth).toHaveProperty('provider');
    expect(hooks.auth).toHaveProperty('methods');
  });
});

describe('tool hook', () => {
  beforeEach(async () => {
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  it('returns tool record', () => {
    expect(hooks.tool).toEqual({});
  });
});

function createChatInput() {
  return {
    sessionID: 'ses_123',
    agent: 'test-agent',
    model: fromAny<Model, unknown>({
      providerID: 'anthropic',
      modelID: 'claude-3',
    }),
    provider: {
      source: 'custom' as const,
      info: {} as Provider,
      options: {},
    },
    message: fromAny<UserMessage, unknown>({
      role: 'user' as const,
      content: 'hello',
    }),
  };
}

describe('remaining event handlers', () => {
  beforeEach(async () => {
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  it('calls resolveEventConfig for chat.params', async () => {
    const resolveSpy = mockResolveEventConfig();
    const input = createChatInput();
    const output = { temperature: 0.7, topP: 0.9, topK: 50, options: {} };

    await hooks['chat.params']!(input, output as never);

    expect(resolveSpy).toHaveBeenCalledWith('chat.params', input);
  });

  it('calls resolveEventConfig for chat.headers', async () => {
    const resolveSpy = mockResolveEventConfig();
    const input = createChatInput();
    const output = { headers: { 'x-api-key': 'test' } };

    await hooks['chat.headers']!(input, output);

    expect(resolveSpy).toHaveBeenCalledWith('chat.headers', input);
  });

  it('calls resolveEventConfig for permission.ask', async () => {
    const resolveSpy = mockResolveEventConfig();

    const input = {
      sessionID: 'ses_123',
      tool: 'bash',
      id: 'perm_1',
      type: 'tool',
      messageID: '',
      title: '',
      metadata: {},
      time: { created: Date.now() },
    };
    const output = { status: 'ask' as const };

    await hooks['permission.ask']!(input, output);

    expect(resolveSpy).toHaveBeenCalledWith('permission.ask', input);
  });

  it('calls resolveEventConfig for command.execute.before', async () => {
    const resolveSpy = mockResolveEventConfig();

    const input = {
      command: '/help',
      sessionID: 'ses_123',
      arguments: '--verbose',
    };
    const output = { parts: [] };

    await hooks['command.execute.before']!(input, output);

    expect(resolveSpy).toHaveBeenCalledWith('command.execute.before', input);
  });

  it('calls resolveEventConfig for experimental.chat.messages.transform', async () => {
    const resolveSpy = mockResolveEventConfig();

    const input = { messages: [] };
    const output = { messages: [] };

    await hooks['experimental.chat.messages.transform']!(input, output);

    expect(resolveSpy).toHaveBeenCalledWith(
      'experimental.chat.messages.transform',
      input
    );
  });

  it('calls resolveEventConfig for experimental.chat.system.transform', async () => {
    const resolveSpy = mockResolveEventConfig();

    const input = {
      sessionID: 'ses_123',
      model: fromAny<Model, unknown>({
        providerID: 'anthropic',
        modelID: 'claude-3',
      }),
    };
    const output = { system: [] };

    await hooks['experimental.chat.system.transform']!(input, output);

    expect(resolveSpy).toHaveBeenCalledWith(
      'experimental.chat.system.transform',
      input
    );
  });

  it('uses default sessionId when sessionID missing in system transform', async () => {
    const input = {
      model: fromAny<Model, unknown>({
        providerID: 'anthropic',
        modelID: 'claude-3',
      }),
    };
    const output = { system: [] };

    await hooks['experimental.chat.system.transform']!(input, output);

    expect(hooks).toBeDefined();
  });

  it('calls resolveEventConfig for experimental.session.compacting', async () => {
    const resolveSpy = mockResolveEventConfig();

    const input = { sessionID: 'ses_123' };
    const output = { context: [] };

    await hooks['experimental.session.compacting']!(input, output);

    expect(resolveSpy).toHaveBeenCalledWith(
      'experimental.session.compacting',
      input
    );
  });

  it('calls resolveEventConfig for experimental.text.complete', async () => {
    const resolveSpy = mockResolveEventConfig();

    const input = {
      sessionID: 'ses_123',
      messageID: 'msg_1',
      partID: 'part_1',
    };
    const output = { text: '' };

    await hooks['experimental.text.complete']!(input, output);

    expect(resolveSpy).toHaveBeenCalledWith(
      'experimental.text.complete',
      input
    );
  });

  it('calls resolveEventConfig for tool.definition', async () => {
    const resolveSpy = mockResolveEventConfig();

    const input = { toolID: 'bash' };
    const output = { description: 'Run shell commands', parameters: {} };

    await hooks['tool.definition']!(input, output);

    expect(resolveSpy).toHaveBeenCalledWith('tool.definition', input);
  });
});
