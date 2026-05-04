import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ResolvedEventConfig } from '.opencode/plugins/types/config';
import type { Hooks } from '@opencode-ai/plugin';
import type { Event, UserMessage, Model, Provider } from '@opencode-ai/sdk';
import type { ChildProcess } from 'child_process';
import { spawn } from 'child_process';
import { fromAny } from '@total-typescript/shoehorn';
import * as startupToastModule from '.opencode/plugins/features/messages/show-startup-toast';
import * as debugModule from '.opencode/plugins/core/debug';

const mockFsObj = vi.hoisted(() => ({
  existsSync: vi.fn<(path: string) => boolean>().mockReturnValue(true),
  statSync: vi
    .fn<() => { isDirectory: () => boolean; size: number }>()
    .mockReturnValue({ isDirectory: () => true, size: 0 }),
  appendFileSync: vi.fn(),
  readdirSync: vi.fn(() => []),
  readFileSync: vi.fn(() => ''),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

const mockFs = vi.hoisted(() => ({ ...mockFsObj, default: mockFsObj }));

const mockSettings = vi.hoisted(() => ({
  userConfig: {
    enabled: true,
    logDisabledEvents: false,
    showPluginStatus: true,
    pluginStatusDisplayMode: 'user-only' as const,
    loadClaudeHookSettings: { enabled: false },
    scriptToasts: {
      showOutput: true,
      showError: true,
      outputVariant: 'warning' as const,
      errorVariant: 'error' as const,
      outputDuration: 5000,
      errorDuration: 15000,
      outputTitle: '- SCRIPTS OUTPUT',
      errorTitle: '- SCRIPT ERROR',
    },
    default: {
      debug: false,
      toast: false,
      runScripts: false,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: false,
    },
    audit: {
      enabled: true,
      level: 'debug' as const,
      basePath: './production/session-logs',
      maxSizeMB: 1,
      maxAgeDays: 30,
      logTruncationKB: 2,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [
        'patch',
        'diff',
        'content',
        'snapshot',
        'output',
        'result',
        'text',
      ],
      files: {
        events: 'plugin-events.json',
        scripts: 'plugin-scripts.json',
        errors: 'plugin-errors.json',
        security: 'plugin-security.json',
        debug: 'plugin-debug.json',
      },
    },
    events: {},
    tools: {
      'tool.execute.after': {},
      'tool.execute.after.subagent': {},
      'tool.execute.before': {},
    },
  },
}));

vi.mock('fs', () => mockFs);
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockRejectedValue(new Error('not found')),
  appendFile: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
  unlink: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('child_process', () => ({
  spawn: vi.fn(() => ({
    stdout: {
      on: vi.fn((event: string, cb: (d: Buffer) => void) => {
        if (event === 'data') cb(Buffer.from(''));
      }),
    },
    stderr: { on: vi.fn() },
    stdin: { write: vi.fn(), end: vi.fn() },
    on: vi.fn((event: string, cb: (code: number) => void) => {
      if (event === 'close') cb(0);
    }),
    unref: vi.fn(),
  })),
}));
vi.mock('.opencode/plugins/config/settings', () => mockSettings);

import * as eventsModule from '.opencode/plugins/features/events/events';
import * as pluginIntegration from '.opencode/plugins/features/audit/plugin-integration';
import * as appendToSessionModule from '.opencode/plugins/features/messages/append-to-session';
import { addSubagentSession } from '.opencode/plugins/features/scripts/run-script-handler';
import * as executorModule from '.opencode/plugins/features/scripts/executor';
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
    debug: false,
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
      showOutput: true,
      showError: true,
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
  mockSettings.userConfig.enabled = true;
  mockSettings.userConfig.logDisabledEvents = false;
  mockFsObj.existsSync.mockImplementation((path: string) => {
    if (path.includes('.opencode/scripts')) return true;
    return false;
  });
  mockFsObj.statSync.mockReturnValue({
    isDirectory: () => true,
    size: 0,
  });
  mockFsObj.readdirSync.mockReturnValue([]);
  mockFsObj.readFileSync.mockReturnValue('');
  mockFsObj.appendFileSync = vi.fn();
  mockFsObj.writeFileSync = vi.fn();
  mockFsObj.mkdirSync = vi.fn();
  mockFsObj.unlinkSync = vi.fn();
  vi.mocked(spawn).mockImplementation(() =>
    fromAny<ChildProcess, unknown>({
      stdout: {
        on: vi.fn((event: string, cb: (d: Buffer) => void) => {
          if (event === 'data') cb(Buffer.from(''));
        }),
      },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') cb(0);
      }),
      unref: vi.fn(),
    })
  );
}

function setupHooks(): Promise<Hooks> {
  resetGlobalToastQueue();
  pluginIntegration.resetAuditLogging();
  (globalThis as Record<string, unknown>).__opencode_debug_recorder = {
    logDebug: vi.fn(),
  };
  (globalThis as Record<string, unknown>).__opencode_security_recorder = {
    logSecurity: vi.fn(),
  };
  setupCommonMocks();
  return OpencodeHooks(mockCtx as never);
}

let hooks: Hooks;

describe('OpencodeHooks initialization', () => {
  afterEach(() => {
    vi.useRealTimers();
    resetGlobalToastQueue();
  });

  it('shows startup toast on first call only', async () => {
    vi.useFakeTimers();
    pluginIntegration.resetAuditLogging();
    setupCommonMocks();
    (globalThis as Record<string, unknown>).__opencode_debug_recorder = {
      logDebug: vi.fn(),
    };
    (globalThis as Record<string, unknown>).__opencode_security_recorder = {
      logSecurity: vi.fn(),
    };

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
    mockSettings.userConfig.enabled = false;
    const result = await OpencodeHooks(mockCtx as never);
    expect(result).toEqual({});
  });
});

describe('OpencodeHooks', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    hooks = await setupHooks();
    await vi.advanceTimersByTimeAsync(300);
  });

  afterEach(() => {
    vi.useRealTimers();
    resetGlobalToastQueue();
  });

  describe('hooks structure', () => {
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
    it('calls resolveEventConfig with event type and properties', async () => {
      const resolveSpy = vi.spyOn(eventsModule, 'resolveEventConfig');

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_123' } },
        } as Event,
      });

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

    it('stops execution when runOnlyOnce and isSubagent', async () => {
      addSubagentSession('ses_sub');

      vi.spyOn(eventsModule, 'resolveEventConfig').mockReturnValue(
        createMockResolvedConfig({ runOnlyOnce: true })
      );

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_sub' } },
        } as Event,
      });

      expect(hooks).toBeDefined();
    });

    it('calls handleDebugLog when resolved config has debug enabled', async () => {
      const debugSpy = vi
        .spyOn(debugModule, 'handleDebugLog')
        .mockResolvedValue(undefined);

      vi.spyOn(eventsModule, 'resolveEventConfig').mockReturnValue(
        createMockResolvedConfig({ debug: true })
      );

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_123' } },
        } as Event,
      });

      expect(debugSpy).toHaveBeenCalled();
    });

    it('shows toast when resolved config has toast enabled', async () => {
      const addSpy = vi
        .spyOn(useGlobalToastQueue(), 'add')
        .mockImplementation(() => {});

      vi.spyOn(eventsModule, 'resolveEventConfig').mockReturnValue(
        createMockResolvedConfig({
          toast: true,
          toastTitle: 'Test Toast',
          toastMessage: 'Test message',
          toastVariant: 'info',
          toastDuration: 5000,
          scripts: [],
        })
      );

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_123' } },
        } as Event,
      });

      expect(addSpy).toHaveBeenCalled();
    });

    it('logs disabled event when logDisabledEvents is true', async () => {
      mockSettings.userConfig.logDisabledEvents = true;
      const logEventSpy = vi
        .spyOn(pluginIntegration.getEventRecorder()!, 'logEvent')
        .mockResolvedValue(undefined);

      vi.spyOn(eventsModule, 'resolveEventConfig').mockReturnValue(
        createMockResolvedConfig({ enabled: false })
      );

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_123' } },
        } as Event,
      });

      expect(logEventSpy).toHaveBeenCalledWith('EVENT_DISABLED', {
        sessionID: 'ses_123',
        context: 'session.created',
      });
    });

    it('does not call getEventRecorder when logDisabledEvents is false', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_123' } },
        } as Event,
      });

      expect(resolveSpy).toHaveBeenCalled();
    });

    it('extracts sessionId from info.id for session events', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_custom' } },
        } as Event,
      });

      expect(resolveSpy).toHaveBeenCalled();
    });

    it('falls back to default sessionId when none provided', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

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
    it('calls resolveToolConfig with tool name and args', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveToolConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

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
      vi.mocked(spawn).mockImplementation(() =>
        fromAny<ChildProcess, unknown>({
          stdout: { on: vi.fn() },
          stderr: {
            on: vi.fn((event: string, cb: (d: Buffer) => void) => {
              if (event === 'data') cb(Buffer.from('Blocked by policy'));
            }),
          },
          stdin: { write: vi.fn(), end: vi.fn() },
          on: vi.fn((event: string, cb: (code: number) => void) => {
            if (event === 'close') cb(2);
          }),
          unref: vi.fn(),
        })
      );

      vi.spyOn(eventsModule, 'resolveToolConfig').mockReturnValue(
        createMockResolvedConfig({
          runScripts: true,
          scripts: [{ source: 'native' as const, path: 'block.sh' }],
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
        })
      );

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
  });

  describe('tool.execute.after handler', () => {
    it('resolves as subagent when task tool has subagent_type', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveToolConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

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
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveToolConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

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
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveToolConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

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
  });

  describe('shell.env handler', () => {
    it('calls resolveEventConfig', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

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
    it('calls resolveEventConfig', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

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
    beforeEach(() => {
      mockFsObj.existsSync.mockImplementation((path: string) => {
        if (path.includes('.opencode/scripts')) return true;
        return false;
      });
      mockFsObj.statSync.mockReturnValue({
        isDirectory: () => true,
        size: 0,
      });
      mockFsObj.readdirSync.mockReturnValue([]);
    });

    it('executes scripts from resolved config', async () => {
      const executeSpy = vi.spyOn(executorModule, 'executeScript');

      vi.spyOn(eventsModule, 'resolveEventConfig').mockReturnValue(
        createMockResolvedConfig({
          runScripts: true,
          scripts: [{ source: 'native' as const, path: 'test.sh' }],
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
        })
      );

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_123' } },
        } as Event,
      });

      expect(executeSpy).toHaveBeenCalledWith(
        { source: 'native', path: 'test.sh' },
        'session.created',
        '',
        expect.any(Object),
        undefined
      );
    });

    it('appends to session when appendToSession is enabled', async () => {
      const { spawn } = await import('child_process');
      vi.mocked(spawn).mockImplementation(() =>
        fromAny<ChildProcess, unknown>({
          stdout: {
            on: vi.fn((event: string, cb: (d: Buffer) => void) => {
              if (event === 'data') cb(Buffer.from('session data'));
            }),
          },
          stderr: { on: vi.fn() },
          stdin: { write: vi.fn(), end: vi.fn() },
          on: vi.fn((event: string, cb: (code: number) => void) => {
            if (event === 'close') cb(0);
          }),
          unref: vi.fn(),
        })
      );

      const appendSpy = vi.spyOn(appendToSessionModule, 'appendToSession');

      vi.spyOn(eventsModule, 'resolveEventConfig').mockReturnValue(
        createMockResolvedConfig({
          runScripts: true,
          appendToSession: true,
          scripts: [{ source: 'native' as const, path: 'test.sh' }],
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
        })
      );

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_123' } },
        } as Event,
      });

      expect(appendSpy).toHaveBeenCalledWith(
        mockCtx,
        'ses_123',
        'session data'
      );
    });

    it('logs scripts via scriptRecorder', async () => {
      const logScriptSpy = vi
        .spyOn(pluginIntegration.getScriptRecorder()!, 'logScript')
        .mockResolvedValue(undefined);

      vi.spyOn(eventsModule, 'resolveEventConfig').mockReturnValue(
        createMockResolvedConfig({
          runScripts: true,
          scripts: [{ source: 'native' as const, path: 'test.sh' }],
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
        })
      );

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_123' } },
        } as Event,
      });

      expect(logScriptSpy).toHaveBeenCalled();
    });

    it('shows error toast when scripts fail and showError is true', async () => {
      const addSpy = vi
        .spyOn(useGlobalToastQueue(), 'add')
        .mockImplementation(() => {});

      vi.mocked(spawn).mockImplementation(() =>
        fromAny<ChildProcess, unknown>({
          stdout: { on: vi.fn() },
          stderr: {
            on: vi.fn((event: string, cb: (d: Buffer) => void) => {
              if (event === 'data') cb(Buffer.from('Script failed'));
            }),
          },
          stdin: { write: vi.fn(), end: vi.fn() },
          on: vi.fn((event: string, cb: (code: number) => void) => {
            if (event === 'close') cb(1);
          }),
          unref: vi.fn(),
        })
      );

      vi.spyOn(eventsModule, 'resolveEventConfig').mockReturnValue(
        createMockResolvedConfig({
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
        })
      );

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_123' } },
        } as Event,
      });

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('SCRIPT ERROR'),
        })
      );
    });

    it('manages stop hook state for session.idle', async () => {
      const { spawn } = await import('child_process');
      vi.mocked(spawn).mockImplementation(() =>
        fromAny<ChildProcess, unknown>({
          stdout: {
            on: vi.fn((event: string, cb: (d: Buffer) => void) => {
              if (event === 'data') cb(Buffer.from(''));
            }),
          },
          stderr: { on: vi.fn() },
          stdin: { write: vi.fn(), end: vi.fn() },
          on: vi.fn((event: string, cb: (code: number) => void) => {
            if (event === 'close') cb(2);
          }),
          unref: vi.fn(),
        })
      );

      const setStopSpy = vi.spyOn(executorModule, 'setStopHookState');
      vi.spyOn(executorModule, 'getStopHookActive').mockReturnValue(false);

      vi.spyOn(eventsModule, 'resolveEventConfig').mockReturnValue(
        createMockResolvedConfig({
          runScripts: true,
          scripts: [{ source: 'native' as const, path: 'idle.sh' }],
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
        })
      );

      await hooks.event!({
        event: {
          type: 'session.idle',
          properties: { sessionID: 'ses_123' },
        } as Event,
      });

      expect(setStopSpy).toHaveBeenCalledWith('ses_123');
    });

    it('clears stop hook state when idle scripts no longer block', async () => {
      const clearSpy = vi.spyOn(executorModule, 'clearStopHookState');
      vi.spyOn(executorModule, 'getStopHookActive').mockReturnValue(true);

      vi.spyOn(eventsModule, 'resolveEventConfig').mockReturnValue(
        createMockResolvedConfig({
          runScripts: true,
          scripts: [{ source: 'native' as const, path: 'idle.sh' }],
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
        })
      );

      await hooks.event!({
        event: {
          type: 'session.idle',
          properties: { sessionID: 'ses_123' },
        } as Event,
      });

      expect(clearSpy).toHaveBeenCalledWith('ses_123');
    });

    it('shows script output toast when configured', async () => {
      const addSpy = vi
        .spyOn(useGlobalToastQueue(), 'add')
        .mockImplementation(() => {});

      const { spawn } = await import('child_process');
      vi.mocked(spawn).mockImplementation(() =>
        fromAny<ChildProcess, unknown>({
          stdout: {
            on: vi.fn((event: string, cb: (d: Buffer) => void) => {
              if (event === 'data') cb(Buffer.from('hello world'));
            }),
          },
          stderr: { on: vi.fn() },
          stdin: { write: vi.fn(), end: vi.fn() },
          on: vi.fn((event: string, cb: (code: number) => void) => {
            if (event === 'close') cb(0);
          }),
          unref: vi.fn(),
        })
      );

      vi.spyOn(eventsModule, 'resolveEventConfig').mockReturnValue(
        createMockResolvedConfig({
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
        })
      );

      await hooks.event!({
        event: {
          type: 'session.created',
          properties: { info: { id: 'ses_123' } },
        } as Event,
      });

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('SCRIPTS OUTPUT'),
        })
      );
    });
  });

  describe('config handler', () => {
    it('is a function', () => {
      expect(typeof hooks.config).toBe('function');
    });
  });

  describe('auth hook', () => {
    it('returns auth structure', () => {
      expect(hooks.auth).toHaveProperty('provider');
      expect(hooks.auth).toHaveProperty('methods');
    });
  });

  describe('tool hook', () => {
    it('returns tool record', () => {
      expect(hooks.tool).toEqual({});
    });
  });

  describe('remaining event handlers', () => {
    it('calls resolveEventConfig for chat.params', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

      const input = {
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
      const output = { temperature: 0.7, topP: 0.9, topK: 50, options: {} };

      await hooks['chat.params']!(input, output as never);

      expect(resolveSpy).toHaveBeenCalledWith('chat.params', input);
    });

    it('calls resolveEventConfig for chat.headers', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

      const input = {
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
      const output = { headers: { 'x-api-key': 'test' } };

      await hooks['chat.headers']!(input, output as never);

      expect(resolveSpy).toHaveBeenCalledWith('chat.headers', input);
    });

    it('calls resolveEventConfig for permission.ask', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

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

      await hooks['permission.ask']!(input, output as never);

      expect(resolveSpy).toHaveBeenCalledWith('permission.ask', input);
    });

    it('calls resolveEventConfig for command.execute.before', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

      const input = {
        command: '/help',
        sessionID: 'ses_123',
        arguments: '--verbose',
      };
      const output = { parts: [] };

      await hooks['command.execute.before']!(input, output as never);

      expect(resolveSpy).toHaveBeenCalledWith('command.execute.before', input);
    });

    it('calls resolveEventConfig for experimental.chat.messages.transform', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

      const input = { messages: [] };
      const output = { messages: [] };

      await hooks['experimental.chat.messages.transform']!(
        input,
        output as never
      );

      expect(resolveSpy).toHaveBeenCalledWith(
        'experimental.chat.messages.transform',
        input
      );
    });

    it('calls resolveEventConfig for experimental.chat.system.transform', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

      const input = {
        sessionID: 'ses_123',
        model: fromAny<Model, unknown>({
          providerID: 'anthropic',
          modelID: 'claude-3',
        }),
      };
      const output = { system: [] };

      await hooks['experimental.chat.system.transform']!(
        input,
        output as never
      );

      expect(resolveSpy).toHaveBeenCalledWith(
        'experimental.chat.system.transform',
        input
      );
    });

    it('calls resolveEventConfig for experimental.session.compacting', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

      const input = { sessionID: 'ses_123' };
      const output = { context: [] };

      await hooks['experimental.session.compacting']!(input, output as never);

      expect(resolveSpy).toHaveBeenCalledWith(
        'experimental.session.compacting',
        input
      );
    });

    it('calls resolveEventConfig for experimental.text.complete', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

      const input = {
        sessionID: 'ses_123',
        messageID: 'msg_1',
        partID: 'part_1',
      };
      const output = { text: '' };

      await hooks['experimental.text.complete']!(input, output as never);

      expect(resolveSpy).toHaveBeenCalledWith(
        'experimental.text.complete',
        input
      );
    });

    it('calls resolveEventConfig for tool.definition', async () => {
      const resolveSpy = vi
        .spyOn(eventsModule, 'resolveEventConfig')
        .mockReturnValue(createMockResolvedConfig({ enabled: false }));

      const input = { toolID: 'bash' };
      const output = { description: 'Run shell commands', parameters: {} };

      await hooks['tool.definition']!(input, output as never);

      expect(resolveSpy).toHaveBeenCalledWith('tool.definition', input);
    });
  });
});
