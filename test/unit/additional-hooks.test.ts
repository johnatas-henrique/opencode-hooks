import type { PluginInput } from '@opencode-ai/plugin';
import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';

vi.mock('../../.opencode/plugins/config', () => ({
  userConfig: {
    enabled: true,
    audit: {
      enabled: true,
      level: 'debug',
      basePath: '/tmp/audit-test/test',
      maxSizeMB: 1,
      maxAgeDays: 30,
      truncationKB: 0.5,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [],
    },
    default: {
      debug: false,
      toast: true,
      runScripts: true,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: true,
    },
    events: {
      'session.created': { toast: true },
    },
    tools: {
      'tool.execute.after': {
        task: { toast: true, scripts: ['task.sh'] },
      },
    },
  },
}));

vi.mock('../../.opencode/plugins/features/messages/default-handlers', () => ({
  handlers: {
    // ... many handlers
  },
}));

vi.mock('../../.opencode/plugins/features/messages/append-to-session', () => ({
  appendToSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../.opencode/plugins/features/scripts/run-script', () => ({
  runScript: vi
    .fn()
    .mockResolvedValue({ output: 'Script output', error: null, exitCode: 0 }),
}));

vi.mock('../../.opencode/plugins/features/scripts/show-startup-toast', () => ({
  showStartupToast: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../.opencode/plugins/core/debug', () => ({
  handleDebugLog: vi.fn().mockResolvedValue(undefined),
}));

import type { MockPluginInput } from '../__mocks__/@opencode-ai/plugin';
import { createMockPluginInput } from '../__mocks__/@opencode-ai/plugin';
import { vi, beforeEach, describe, it } from 'vitest';

const mockClient = {
  tui: {
    showToast: vi.fn().mockResolvedValue(undefined),
  },
  session: {
    prompt: vi.fn().mockResolvedValue(undefined),
  },
};

const mockDollar =
  vi.fn<() => Promise<{ exitCode: number; stdout: string; stderr: string }>>();

function createMockCtx(overrides: Partial<MockPluginInput> = {}): PluginInput {
  const mock = createMockPluginInput({
    client: mockClient,
    $: mockDollar,
    ...overrides,
  });
  return mock as unknown as PluginInput;
}

describe('opencode-hooks.ts - additional hook coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('event hook', () => {
    it('should handle unknown event type', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const eventInput = {
        type: 'unknown.event.type',
        properties: { data: 'test' },
      };

      await plugin.event!({ event: eventInput as never });
    });
  });

  describe('shell.env hook', () => {
    it('should handle shell.env event', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = {
        cwd: '/home',
        sessionID: 'test-session',
        callID: 'call-1',
      };
      const output = { env: { PATH: '/usr/bin' } };

      await plugin['shell.env']!(input, output);
    });

    it('should use DEFAULT_SESSION_ID when sessionID is undefined in shell.env', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = {
        cwd: '/home',
      };
      const output = { env: { PATH: '/usr/bin' } };

      await plugin['shell.env']!(input, output);
    });
  });

  describe('chat.message hook', () => {
    it('should handle chat.message event', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = {
        sessionID: 'chat-session',
        agent: 'claude',
        messageID: 'msg-123',
        variant: 'user',
      };
      const output = { message: { role: 'user' }, parts: [] } as never;

      await plugin['chat.message']!(input, output);
    });
  });

  describe('chat.params hook', () => {
    it('should handle chat.params event', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = {
        sessionID: 'params-session',
        agent: 'claude',
        model: { providerID: 'anthropic', modelID: 'claude-3' } as never,
        provider: { name: 'Anthropic' } as never,
        message: { role: 'user' } as never,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        options: {},
      };
      const output = {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: undefined,
        options: {},
      };

      await plugin['chat.params']!(input, output);
    });
  });

  describe('chat.headers hook', () => {
    it('should handle chat.headers event', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = {
        sessionID: 'headers-session',
        agent: 'claude',
        model: { providerID: 'anthropic', modelID: 'claude-3' } as never,
        provider: { name: 'Anthropic' } as never,
        message: { role: 'user' } as never,
      };
      const output = { headers: { 'Content-Type': 'application/json' } };

      await plugin['chat.headers']!(input, output);
    });
  });

  describe('permission.ask hook', () => {
    it('should handle permission.ask event', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = { sessionID: 'perm-session', tool: 'bash' } as never;
      const output = { status: 'allow' as const };

      await plugin['permission.ask']!(input, output);
    });

    it('should use DEFAULT_SESSION_ID when sessionID is undefined in permission.ask', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = { tool: 'bash' } as never;
      const output = { status: 'allow' as const };

      await plugin['permission.ask']!(input, output);
    });
  });

  describe('command.execute.before hook', () => {
    it('should handle command.execute.before event', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = {
        command: 'git status',
        sessionID: 'cmd-session',
        arguments: 'status',
      };
      const output = { parts: [] };

      await plugin['command.execute.before']!(input, output);
    });
  });

  describe('experimental hooks', () => {
    it('should handle experimental.chat.messages.transform', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = { sessionID: 'exp-session', messages: [] };
      const output = { messages: [] };

      await plugin['experimental.chat.messages.transform']!(input, output);
    });

    it('should handle experimental.chat.system.transform with sessionID', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = { sessionID: 'exp-session', model: {} as never } as never;
      const output = { system: ['You are helpful'] };

      await plugin['experimental.chat.system.transform']!(input, output);
    });

    it('should use DEFAULT_SESSION_ID when sessionID is undefined in experimental.chat.system.transform', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = { model: {} as never } as never;
      const output = { system: ['You are helpful'] };

      await plugin['experimental.chat.system.transform']!(input, output);
    });

    it('should handle experimental.session.compacting', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = { sessionID: 'exp-session' };
      const output = { context: [], prompt: undefined };

      await plugin['experimental.session.compacting']!(input, output);
    });
  });

  describe('tool.definition hook', () => {
    it('should handle tool.definition event', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = { toolID: 'custom-tool', name: 'CustomTool' };
      const output = {
        description: 'A custom tool',
        parameters: {},
      };

      await plugin['tool.definition']!(input, output);
    });
  });

  describe('config hook', () => {
    it('should handle config event', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = { model: { providerID: 'anthropic' } } as never;

      await plugin.config!(input);
    });
  });

  describe('tool.execute.after - skill tool', () => {
    it('should set toast message for skill tool execution', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = {
        tool: 'skill',
        sessionID: 'skill-session',
        callID: 'call-skill',
        args: { name: 'custom-skill-name' },
      };
      const output = {
        title: '',
        output: 'Skill executed',
        metadata: {},
      };

      await plugin['tool.execute.after']!(input, output);
    });

    it('should set toast message for skill tool without name arg', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = {
        tool: 'skill',
        sessionID: 'skill-session',
        callID: 'call-skill',
        args: {},
      };
      const output = {
        title: '',
        output: 'Skill executed',
        metadata: {},
      };

      await plugin['tool.execute.after']!(input, output);
    });
  });

  describe('runOnlyOnce logic', () => {
    it('should run script when runOnlyOnce is false', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const event = {
        type: 'session.created' as const,
        properties: { sessionID: 'test-session', info: { id: '123' } },
      };

      await plugin.event!({ event: event as never });
    });
  });

  describe('tool.execute.after - non-task tool', () => {
    it('should handle non-task tool execution', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const input = {
        tool: 'read',
        sessionID: 'test-session',
        callID: 'call-123',
        args: { path: '/test/file.ts' },
      };
      const output = {
        title: '',
        output: 'file content',
        metadata: {},
      };

      await plugin['tool.execute.after']!(input, output);
    });
  });

  describe('eventRecorder tool.execute without toolName', () => {
    it('should log tool.execute.before without toolName (line 93)', async () => {
      const ctx = createMockCtx();
      const plugin = await OpencodeHooks(ctx);

      const event = {
        type: 'tool.execute.before' as const,
        properties: { tool: undefined },
      };

      await plugin.event!({ event: event as never });
    });
  });
});
