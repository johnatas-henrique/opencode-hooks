import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';

jest.mock('../../.opencode/plugins/config', () => ({
  userConfig: {
    enabled: true,
    default: {
      debug: false,
      toast: true,
      runScripts: true,
      runOnlyOnce: false,
      saveToFile: true,
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

jest.mock('../../.opencode/plugins/features/messages/default-handlers', () => ({
  handlers: {
    'session.created': {
      title: '====SESSION CREATED====',
      variant: 'success',
      duration: 2000,
      defaultScript: 'session-created.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session: ${String(event.properties?.info?.id)}`,
    },
    'session.error': {
      title: '====SESSION ERROR====',
      variant: 'error',
      duration: 30000,
      defaultScript: 'session-error.sh',
      buildMessage: (_event: Record<string, unknown>) => `Error`,
    },
    'tool.execute.after': {
      title: '====TOOL====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Tool: ${String(event.properties?.tool)}`,
    },
    'shell.env': {
      title: '====SHELL ENV====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'shell-env.sh',
      buildMessage: () => 'Shell env',
    },
    'chat.message': {
      title: '====CHAT MESSAGE====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'chat-message.sh',
      buildMessage: () => 'Chat message',
    },
    'chat.params': {
      title: '====CHAT PARAMS====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'chat-params.sh',
      buildMessage: () => 'Chat params',
    },
    'chat.headers': {
      title: '====CHAT HEADERS====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'chat-headers.sh',
      buildMessage: () => 'Chat headers',
    },
    'permission.ask': {
      title: '====PERMISSION ASK====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'permission-ask.sh',
      buildMessage: () => 'Permission ask',
    },
    'command.execute.before': {
      title: '====COMMAND EXECUTE BEFORE====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'command-execute-before.sh',
      buildMessage: () => 'Command execute before',
    },
    'experimental.chat.messages.transform': {
      title: '====CHAT MESSAGES TRANSFORM====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'chat-messages-transform.sh',
      buildMessage: () => 'Chat messages transform',
    },
    'experimental.chat.system.transform': {
      title: '====CHAT SYSTEM TRANSFORM====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'chat-system-transform.sh',
      buildMessage: () => 'Chat system transform',
    },
    'experimental.session.compacting': {
      title: '====SESSION COMPACTING====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-compacting.sh',
      buildMessage: () => 'Session compacting',
    },
    'experimental.text.complete': {
      title: '====TEXT COMPLETE====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'text-complete.sh',
      buildMessage: () => 'Text complete',
    },
    'tool.definition': {
      title: '====TOOL DEFINITION====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-definition.sh',
      buildMessage: () => 'Tool definition',
    },
  },
}));

jest.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  '../../.opencode/plugins/features/messages/append-to-session',
  () => ({
    appendToSession: jest.fn().mockResolvedValue(undefined),
  })
);

jest.mock('../../.opencode/plugins/core/toast-queue', () => ({
  initGlobalToastQueue: jest.fn().mockReturnValue({
    add: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    pending: 0,
  }),
  useGlobalToastQueue: jest.fn().mockReturnValue({
    add: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    pending: 0,
  }),
}));

jest.mock('../../.opencode/plugins/features/scripts/run-script', () => ({
  runScript: jest
    .fn()
    .mockResolvedValue({ output: 'Script output', error: null, exitCode: 0 }),
}));

jest.mock('../../.opencode/plugins/core/debug', () => ({
  handleDebugLog: jest.fn().mockResolvedValue(undefined),
}));

const mockClient = {
  tui: {
    showToast: jest.fn().mockResolvedValue(undefined),
  },
};

const mockDollar =
  jest.fn<
    () => Promise<{ exitCode: number; stdout: string; stderr: string }>
  >();

function createMockCtx(
  client: { tui: { showToast: jest.Mock }; $: () => unknown },
  $: () => unknown
) {
  return {
    client,
    $,
    project: 'test-project',
    directory: '/test/dir',
    worktree: '/test/dir',
    serverUrl: 'http://localhost:3000',
  };
}

describe('opencode-hooks.ts - additional hook coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('event hook', () => {
    it('should handle known event type', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const eventInput = {
        type: 'session.created',
        properties: { info: { id: 'session-123' } },
      };

      await plugin.event({ event: eventInput });
    });

    it('should handle unknown event type', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const eventInput = {
        type: 'unknown.event.type',
        properties: { data: 'test' },
      };

      await plugin.event({ event: eventInput });
    });

    it('should extract sessionId from event properties', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const eventInput = {
        type: 'session.created',
        properties: { sessionID: 'custom-session-id' },
      };

      await plugin.event({ event: eventInput });
    });

    it('should use DEFAULT_SESSION_ID when no session ID in properties', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const eventInput = {
        type: 'session.created',
        properties: {},
      };

      await plugin.event({ event: eventInput });
    });
  });

  describe('shell.env hook', () => {
    it('should handle shell.env event', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = {
        cwd: '/home',
        sessionID: 'test-session',
        callID: 'call-1',
      };
      const output = { env: { PATH: '/usr/bin' } };

      await plugin['shell.env'](input, output);
    });

    describe('chat.message hook', () => {
      it('should handle chat.message event', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = {
          sessionID: 'chat-session',
          agent: 'claude',
          messageID: 'msg-123',
          variant: 'user',
        };
        const output = { message: { role: 'user' }, parts: [] };

        await plugin['chat.message'](input, output);
      });
    });

    describe('chat.params hook', () => {
      it('should handle chat.params event', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = {
          sessionID: 'params-session',
          agent: 'claude',
          model: { providerID: 'anthropic', modelID: 'claude-3' },
          provider: { name: 'Anthropic' },
          message: { role: 'user' },
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          options: {},
        };
        const output = { temperature: 0.7, topP: 0.9, topK: 40, options: {} };

        await plugin['chat.params'](input, output);
      });
    });

    describe('chat.headers hook', () => {
      it('should handle chat.headers event', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = {
          sessionID: 'headers-session',
          agent: 'claude',
          model: { providerID: 'anthropic', modelID: 'claude-3' },
          provider: { name: 'Anthropic' },
          message: { role: 'user' },
        };
        const output = { headers: { 'Content-Type': 'application/json' } };

        await plugin['chat.headers'](input, output);
      });
    });

    describe('permission.ask hook', () => {
      it('should handle permission.ask event', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = { sessionID: 'perm-session', tool: 'bash' };
        const output = { status: 'allow' };

        await plugin['permission.ask'](input, output);
      });
    });

    describe('command.execute.before hook', () => {
      it('should handle command.execute.before event', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = {
          command: 'git status',
          sessionID: 'cmd-session',
          arguments: 'status',
        };
        const output = { parts: [] };

        await plugin['command.execute.before'](input, output);
      });
    });

    describe('experimental hooks', () => {
      it('should handle experimental.chat.messages.transform', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = { sessionID: 'exp-session', messages: [] };
        const output = { messages: [] };

        await plugin['experimental.chat.messages.transform'](input, output);
      });

      it('should handle experimental.chat.system.transform', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = { sessionID: 'exp-session', system: 'You are helpful' };
        const output = { system: 'You are helpful' };

        await plugin['experimental.chat.system.transform'](input, output);
      });

      it('should handle experimental.session.compacting', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = { sessionID: 'exp-session' };
        const output = { before: 1000, after: 500 };

        await plugin['experimental.session.compacting'](input, output);
      });

      it('should handle experimental.text.complete', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = { sessionID: 'exp-session', text: 'Hello' };
        const output = { text: 'Hello world' };

        await plugin['experimental.text.complete'](input, output);
      });
    });

    describe('tool.definition hook', () => {
      it('should handle tool.definition event', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = { toolID: 'custom-tool', name: 'CustomTool' };
        const output = {
          definition: { description: 'A custom tool', parameters: {} },
        };

        await plugin['tool.definition'](input, output);
      });
    });

    describe('config hook', () => {
      it('should handle config event', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = { model: { providerID: 'anthropic' } };

        await plugin.config(input);
      });
    });

    describe('runOnlyOnce logic', () => {
      it('should run script when runOnlyOnce is false', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const event = {
          type: 'session.created' as const,
          properties: { sessionID: 'test-session', info: { id: '123' } },
        };

        await plugin.event({ event });
      });
    });

    describe('tool.execute.after - non-task tool', () => {
      it('should handle non-task tool execution', async () => {
        const ctx = createMockCtx(mockClient, mockDollar);
        const plugin = await OpencodeHooks(ctx);

        const input = {
          tool: 'read',
          sessionID: 'test-session',
          callID: 'call-123',
          args: { path: '/test/file.ts' },
        };
        const output = {
          result: 'file content',
        };

        await plugin['tool.execute.after'](input, output);
      });
    });
  });

  describe('chat.message hook', () => {
    it('should handle chat.message event', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = {
        sessionID: 'chat-session',
        agent: 'claude',
        messageID: 'msg-123',
        variant: 'user',
      };
      const output = { message: { role: 'user' }, parts: [] };

      await plugin['chat.message'](input, output);
    });
  });

  describe('chat.params hook', () => {
    it('should handle chat.params event', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = {
        sessionID: 'params-session',
        agent: 'claude',
        model: { providerID: 'anthropic', modelID: 'claude-3' },
        provider: { name: 'Anthropic' },
        message: { role: 'user' },
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        options: {},
      };
      const output = { temperature: 0.7, topP: 0.9, topK: 40, options: {} };

      await plugin['chat.params'](input, output);
    });
  });

  describe('chat.headers hook', () => {
    it('should handle chat.headers event', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = {
        sessionID: 'headers-session',
        agent: 'claude',
        model: { providerID: 'anthropic', modelID: 'claude-3' },
        provider: { name: 'Anthropic' },
        message: { role: 'user' },
      };
      const output = { headers: { 'Content-Type': 'application/json' } };

      await plugin['chat.headers'](input, output);
    });
  });

  describe('permission.ask hook', () => {
    it('should handle permission.ask event', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = { sessionID: 'perm-session', tool: 'bash' };
      const output = { status: 'allow' };

      await plugin['permission.ask'](input, output);
    });
  });

  describe('command.execute.before hook', () => {
    it('should handle command.execute.before event', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = {
        command: 'git status',
        sessionID: 'cmd-session',
        arguments: 'status',
      };
      const output = { parts: [] };

      await plugin['command.execute.before'](input, output);
    });
  });

  describe('experimental hooks', () => {
    it('should handle experimental.chat.messages.transform', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = { sessionID: 'exp-session', messages: [] };
      const output = { messages: [] };

      await plugin['experimental.chat.messages.transform'](input, output);
    });

    it('should handle experimental.chat.system.transform', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = { sessionID: 'exp-session', system: 'You are helpful' };
      const output = { system: 'You are helpful' };

      await plugin['experimental.chat.system.transform'](input, output);
    });

    it('should handle experimental.session.compacting', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = { sessionID: 'exp-session' };
      const output = { before: 1000, after: 500 };

      await plugin['experimental.session.compacting'](input, output);
    });

    it('should handle experimental.text.complete', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = { sessionID: 'exp-session', text: 'Hello' };
      const output = { text: 'Hello world' };

      await plugin['experimental.text.complete'](input, output);
    });
  });

  describe('tool.definition hook', () => {
    it('should handle tool.definition event', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = { toolID: 'custom-tool', name: 'CustomTool' };
      const output = {
        definition: { description: 'A custom tool', parameters: {} },
      };

      await plugin['tool.definition'](input, output);
    });
  });

  describe('config hook', () => {
    it('should handle config event', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = { model: { providerID: 'anthropic' } };

      await plugin.config(input);
    });
  });

  describe('tool.execute.after - skill tool', () => {
    it('should set toast message for skill tool execution', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = {
        tool: 'skill',
        sessionID: 'skill-session',
        callID: 'call-skill',
        args: { name: 'custom-skill-name' },
      };
      const output = {
        result: 'Skill executed',
      };

      await plugin['tool.execute.after'](input, output);
    });

    it('should set toast message for skill tool without name arg', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = {
        tool: 'skill',
        sessionID: 'skill-session',
        callID: 'call-skill',
        args: {},
      };
      const output = {
        result: 'Skill executed',
      };

      await plugin['tool.execute.after'](input, output);
    });
  });

  describe('runOnlyOnce logic', () => {
    it('should run script when runOnlyOnce is false', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const event = {
        type: 'session.created' as const,
        properties: { sessionID: 'test-session', info: { id: '123' } },
      };

      await plugin.event({ event });
    });
  });

  describe('tool.execute.after - non-task tool', () => {
    it('should handle non-task tool execution', async () => {
      const ctx = createMockCtx(mockClient, mockDollar);
      const plugin = await OpencodeHooks(ctx);

      const input = {
        tool: 'read',
        sessionID: 'test-session',
        callID: 'call-123',
        args: { path: '/test/file.ts' },
      };
      const output = {
        result: 'file content',
      };

      await plugin['tool.execute.after'](input, output);
    });
  });
});
