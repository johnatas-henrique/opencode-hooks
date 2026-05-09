import { describe, it, expect } from 'vitest';
import {
  chatHandlers,
  commandHandlers,
  serverHandlers,
  shellHandlers,
  todoHandlers,
  tuiHandlers,
  lspHandlers,
  experimentalHandlers,
  otherHandlers,
} from '.opencode/plugins/features/handlers/misc-handlers';

function assertToastConfig(
  result: { title: string; variant: string; duration: number },
  expected: { title: string; variant: string; duration: number }
) {
  expect(result.title).toBe(expected.title);
  expect(result.variant).toBe(expected.variant);
  expect(result.duration).toBe(expected.duration);
}

function assertAllInfoHandlers(
  handlers: Record<
    string,
    { variant: string; duration: number; buildMessage: unknown }
  >,
  keys: readonly string[]
) {
  for (const key of keys) {
    const h = handlers[key];
    expect(h.variant).toBe('info');
    expect(h.duration).toBe(5000);
    expect(typeof h.buildMessage).toBe('function');
  }
}

describe('chatHandlers', () => {
  const keys = ['chat.headers', 'chat.message', 'chat.params'] as const;

  it('contains all expected keys', () => {
    for (const key of keys) {
      expect(chatHandlers).toHaveProperty(key);
    }
    expect(Object.keys(chatHandlers).length).toBe(keys.length);
  });

  it('all are info variant with FIVE_SECONDS and buildKeysMessageSimple', () => {
    assertAllInfoHandlers(chatHandlers, keys);
  });
});

describe('commandHandlers', () => {
  const keys = ['command.execute.before', 'command.executed'] as const;

  it('contains all expected keys', () => {
    for (const key of keys) {
      expect(commandHandlers).toHaveProperty(key);
    }
    expect(Object.keys(commandHandlers).length).toBe(keys.length);
  });

  it('command.execute.before has correct title and script', () => {
    const h = commandHandlers['command.execute.before'];
    expect(h.title).toBe('====COMMAND EXECUTE BEFORE====');
    expect(h.defaultScript).toBe('command-execute-before.sh');
  });

  it('command.executed has correct title and script', () => {
    const h = commandHandlers['command.executed'];
    expect(h.title).toBe('====COMMAND EXECUTED====');
    expect(h.defaultScript).toBe('command-executed.sh');
  });
});

describe('serverHandlers', () => {
  const keys = ['server.connected', 'server.instance.disposed'] as const;

  it('contains all expected keys', () => {
    for (const key of keys) {
      expect(serverHandlers).toHaveProperty(key);
    }
    expect(Object.keys(serverHandlers).length).toBe(keys.length);
  });

  it('server.connected is success with TEN_SECONDS', () => {
    const h = serverHandlers['server.connected'];
    assertToastConfig(h, {
      title: '====SERVER CONNECTED====',
      variant: 'success',
      duration: 10000,
    });
    expect(h.defaultScript).toBe('server-connected.sh');
  });

  it('server.instance.disposed is info with FIVE_SECONDS', () => {
    const h = serverHandlers['server.instance.disposed'];
    assertToastConfig(h, {
      title: '====SERVER DISPOSED====',
      variant: 'info',
      duration: 5000,
    });
    expect(h.defaultScript).toBe('server-instance-disposed.sh');
  });
});

describe('shellHandlers', () => {
  it('contains shell.env', () => {
    expect(shellHandlers).toHaveProperty('shell.env');
    expect(Object.keys(shellHandlers).length).toBe(1);
    const h = shellHandlers['shell.env'];
    assertToastConfig(h, {
      title: '====SHELL ENV====',
      variant: 'info',
      duration: 5000,
    });
    expect(h.defaultScript).toBe('shell-env.sh');
  });
});

describe('todoHandlers', () => {
  it('contains todo.updated', () => {
    expect(todoHandlers).toHaveProperty('todo.updated');
    expect(Object.keys(todoHandlers).length).toBe(1);
    const h = todoHandlers['todo.updated'];
    assertToastConfig(h, {
      title: '====TODO UPDATED====',
      variant: 'info',
      duration: 5000,
    });
    expect(h.defaultScript).toBe('todo-updated.sh');
  });
});

describe('tuiHandlers', () => {
  const keys = [
    'tui.command.execute',
    'tui.prompt.append',
    'tui.toast.show',
  ] as const;

  it('contains all expected keys', () => {
    for (const key of keys) {
      expect(tuiHandlers).toHaveProperty(key);
    }
    expect(Object.keys(tuiHandlers).length).toBe(keys.length);
  });

  it('all are info variant with FIVE_SECONDS', () => {
    assertAllInfoHandlers(tuiHandlers, keys);
  });
});

describe('lspHandlers', () => {
  const keys = ['lsp.client.diagnostics', 'lsp.updated'] as const;

  it('contains all expected keys', () => {
    for (const key of keys) {
      expect(lspHandlers).toHaveProperty(key);
    }
    expect(Object.keys(lspHandlers).length).toBe(keys.length);
  });

  it('all are info variant with FIVE_SECONDS', () => {
    assertAllInfoHandlers(lspHandlers, keys);
  });
});

describe('experimentalHandlers', () => {
  const keys = [
    'experimental.chat.messages.transform',
    'experimental.chat.system.transform',
    'experimental.session.compacting',
    'experimental.text.complete',
  ] as const;

  it('contains all expected keys', () => {
    for (const key of keys) {
      expect(experimentalHandlers).toHaveProperty(key);
    }
    expect(Object.keys(experimentalHandlers).length).toBe(keys.length);
  });

  it('all are info variant with FIVE_SECONDS', () => {
    assertAllInfoHandlers(experimentalHandlers, keys);
  });
});

describe('otherHandlers', () => {
  const keys = [
    'tool.definition',
    'unknown.event',
    'installation.updated',
  ] as const;

  it('contains all expected keys', () => {
    for (const key of keys) {
      expect(otherHandlers).toHaveProperty(key);
    }
    expect(Object.keys(otherHandlers).length).toBe(keys.length);
  });

  it('each has required properties', () => {
    for (const key of keys) {
      const h = otherHandlers[key];
      expect(h).toHaveProperty('title');
      expect(h).toHaveProperty('variant');
      expect(h).toHaveProperty('duration');
      expect(h).toHaveProperty('defaultScript');
      expect(h).toHaveProperty('buildMessage');
    }
  });

  it('tool.definition is info', () => {
    const h = otherHandlers['tool.definition'];
    expect(h.title).toBe('====TOOL DEFINITION====');
    expect(h.variant).toBe('info');
    expect(h.defaultScript).toBe('tool-definition.sh');
  });

  it('unknown.event is warning', () => {
    const h = otherHandlers['unknown.event'];
    expect(h.title).toBe('====UNKNOWN EVENT====');
    expect(h.variant).toBe('warning');
    expect(h.defaultScript).toBe('unknown-event.sh');
  });

  it('installation.updated is info', () => {
    const h = otherHandlers['installation.updated'];
    expect(h.title).toBe('====INSTALLATION UPDATED====');
    expect(h.variant).toBe('info');
    expect(h.defaultScript).toBe('installation-updated.sh');
  });
});
