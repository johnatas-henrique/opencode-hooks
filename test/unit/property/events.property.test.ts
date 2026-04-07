import {
  resolveEventConfig,
  resolveToolConfig,
} from '../../../.opencode/plugins/helpers/events';

jest.mock('../../../.opencode/plugins/helpers/default-handlers', () => ({
  handlers: {
    'session.created': {
      title: '====TEST====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'test.sh',
      buildMessage: () => 'test',
    },
    'session.error': {
      title: '====ERROR====',
      variant: 'error',
      duration: 30000,
      defaultScript: 'error.sh',
      buildMessage: () => 'error',
    },
    'tool.execute.after': {
      title: '====TOOL====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool.sh',
      buildMessage: () => 'tool',
    },
  },
}));

jest.mock('../../../.opencode/plugins/helpers/user-events.config', () => ({
  userConfig: {
    enabled: true,
    default: {
      debug: false,
      toast: true,
      runScripts: true,
      runOnlyOnce: false,
      saveToFile: true,
      appendToSession: false,
    },
    events: {
      'session.created': { toast: true },
      'session.error': { toast: true },
    },
    tools: {
      'tool.execute.after': {
        task: { toast: true, scripts: ['task.sh'] },
        skill: { toast: true, scripts: ['skill.sh'] },
      },
    },
  },
}));

describe('Property-based: resolveEventConfig', () => {
  it('should return valid object for all known event types', () => {
    const eventTypes = [
      'session.created',
      'session.error',
      'session.compacted',
      'session.deleted',
      'session.idle',
      'session.status',
      'session.updated',
      'server.instance.disposed',
      'shell.env',
      'tool.execute.before',
      'tool.execute.after',
      'message.part.removed',
      'message.part.updated',
      'message.part.delta',
      'message.removed',
      'message.updated',
      'file.edited',
      'file.watcher.updated',
      'permission.asked',
      'permission.replied',
    ];

    for (const eventType of eventTypes) {
      const config = resolveEventConfig(eventType);

      expect(config).toBeDefined();
      expect(typeof config.enabled).toBe('boolean');
      expect(typeof config.toast).toBe('boolean');
      expect(typeof config.saveToFile).toBe('boolean');
      expect(typeof config.runOnlyOnce).toBe('boolean');
      expect(Array.isArray(config.scripts)).toBe(true);
    }
  });

  it('should return valid toastVariant', () => {
    const validVariants = ['success', 'warning', 'error', 'info'];

    const config = resolveEventConfig('session.created');
    expect(validVariants).toContain(config.toastVariant);
  });

  it('should return positive toastDuration', () => {
    const config = resolveEventConfig('session.created');
    expect(config.toastDuration).toBeGreaterThan(0);
  });

  it('should be deterministic (same input = same output)', () => {
    const config1 = resolveEventConfig('session.created');
    const config2 = resolveEventConfig('session.created');
    const config3 = resolveEventConfig('session.created');

    expect(config1).toEqual(config2);
    expect(config2).toEqual(config3);
  });
});

describe('Property-based: resolveToolConfig', () => {
  it('should return valid object for all known tool types', () => {
    const toolNames = [
      'task',
      'skill',
      'read',
      'write',
      'edit',
      'glob',
      'grep',
      'bash',
      'chat',
      'git.commit',
    ];

    for (const toolName of toolNames) {
      const config = resolveToolConfig('tool.execute.after', toolName);

      expect(config).toBeDefined();
      expect(typeof config.enabled).toBe('boolean');
      expect(typeof config.toast).toBe('boolean');
      expect(typeof config.saveToFile).toBe('boolean');
      expect(Array.isArray(config.scripts)).toBe(true);
    }
  });

  it('should handle unknown tool names without crashing', () => {
    const unknownTools = [
      'unknown-tool',
      'random123',
      'tool-does-not-exist',
      'MY_TOOL',
      '',
    ];

    for (const toolName of unknownTools) {
      expect(() => {
        resolveToolConfig('tool.execute.after', toolName);
      }).not.toThrow();
    }
  });

  it('should be deterministic (same input = same output)', () => {
    const config1 = resolveToolConfig('tool.execute.after', 'task');
    const config2 = resolveToolConfig('tool.execute.after', 'task');
    const config3 = resolveToolConfig('tool.execute.after', 'task');

    expect(config1).toEqual(config2);
    expect(config2).toEqual(config3);
  });
});
