import { createResolvers } from '../helpers';
import { createUserConfig } from '../helpers';

describe('events - resolveEventConfig', () => {
  it('should return defaults for event not listed', () => {
    const { eventResolver } = createResolvers(createUserConfig());
    const config = eventResolver.resolve('session.unknown');

    expect(config.enabled).toBe(true);
    expect(config.toast).toBe(true);
    expect(config.toastTitle).toBe('====UNKNOWN SESSION EVENT====');
    expect(config.toastVariant).toBe('warning');
    expect(config.toastDuration).toBe(5000);
    expect(config.scripts).toEqual([]);
    expect(config.saveToFile).toBe(true);
    expect(config.appendToSession).toBe(true);
  });

  it('should return enabled: false for event set to false', () => {
    const config = createUserConfig({ events: { 'session.disabled': false } });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.disabled');

    expect(result.enabled).toBe(false);
  });

  it('should return default script for event set to boolean true', () => {
    const config = createUserConfig({ events: { 'session.created': true } });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.created');

    expect(result.enabled).toBe(true);
    expect(result.scripts).toEqual(['session-created.sh']);
  });

  it('should return specified scripts for event with scripts array', () => {
    const config = createUserConfig({
      events: {
        'session.custom': {
          scripts: ['custom-a.sh', 'custom-b.sh'],
        },
      },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.custom');

    expect(result.enabled).toBe(true);
    expect(result.scripts).toEqual(['custom-a.sh', 'custom-b.sh']);
  });

  it('should return empty scripts when runScripts: false wins over scripts', () => {
    const config = createUserConfig({
      events: {
        'session.no-scripts': {
          runScripts: false,
          scripts: ['should-be-ignored.sh'],
        },
      },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.no-scripts');

    expect(result.scripts).toEqual([]);
  });

  it('should return empty array when event config is boolean false', () => {
    const config = createUserConfig({
      events: { 'session.test': false },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.test');

    expect(result.scripts).toEqual([]);
  });

  it('should return toast: false when default toast is object with enabled: false', () => {
    const config = createUserConfig({
      default: { toast: { enabled: false } },
      events: { 'session.test': true },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.test');

    expect(result.toast).toBe(false);
  });

  it('should return toast: false for event with toast: false', () => {
    const config = createUserConfig({
      events: { 'session.toast-off': { toast: false } },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.toast-off');

    expect(result.toast).toBe(false);
  });

  it('should return custom toast settings for event with toast object', () => {
    const config = createUserConfig({
      events: {
        'session.toast-custom': {
          toast: {
            title: 'Custom Title',
            variant: 'warning',
            duration: 5000,
            message: 'Custom message',
          },
        },
      },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.toast-custom');

    expect(result.toast).toBe(true);
    expect(result.toastTitle).toBe('Custom Title');
    expect(result.toastVariant).toBe('warning');
    expect(result.toastDuration).toBe(5000);
    expect(result.toastMessage).toBe('Custom message');
  });

  it('should return custom saveToFile when overridden', () => {
    const config = createUserConfig({
      events: { 'session.save-override': { saveToFile: false } },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.save-override');

    expect(result.saveToFile).toBe(false);
  });

  it('should return custom appendToSession when overridden', () => {
    const config = createUserConfig({
      events: { 'session.append-override': { appendToSession: false } },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.append-override');

    expect(result.appendToSession).toBe(false);
  });

  it('should return empty scripts when event is boolean true and global runScripts is false', () => {
    const config = createUserConfig({
      default: { runScripts: false },
      events: { 'session.created': { runScripts: false } },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.created');

    expect(result.enabled).toBe(true);
    expect(result.scripts).toEqual([]);
  });
});

describe('events - resolveToolConfig', () => {
  it('should return tool-specific config when found', () => {
    const config = createUserConfig({
      tools: {
        'tool.execute.after': {
          task: {
            toast: true,
            scripts: ['log-agent.sh'],
            runOnlyOnce: true,
          },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.after', 'task');

    expect(result.enabled).toBe(true);
    expect(result.toast).toBe(true);
    expect(result.scripts).toEqual(['log-agent.sh']);
  });

  it('should fall back to resolveEventConfig when tool not found', () => {
    const config = createUserConfig({
      events: { 'tool.execute.after': { toast: true } },
      tools: { 'tool.execute.after': {} },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.after', 'unknown-tool');

    expect(result.enabled).toBe(true);
    expect(result.toast).toBe(true);
    expect(result.scripts).toEqual([]);
  });

  it('should return enabled: false when tool is disabled', () => {
    const config = createUserConfig({
      tools: {
        'tool.execute.after': {
          disabled: false,
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.after', 'disabled');

    expect(result.enabled).toBe(false);
  });

  it('should return toast: false for chat tool', () => {
    const config = createUserConfig({
      tools: {
        'tool.execute.after': {
          chat: { toast: false },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.after', 'chat');

    expect(result.toast).toBe(false);
  });

  it('should return empty scripts for git.commit with runScripts: false', () => {
    const config = createUserConfig({
      tools: {
        'tool.execute.after': {
          'git.commit': { runScripts: false },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.after', 'git.commit');

    expect(result.scripts).toEqual([]);
  });
});

describe('events - getHandler', () => {
  it('should return handler for known event type', () => {
    const { context } = createResolvers(createUserConfig());
    const handler = context.handlers['session.created'];

    expect(handler).toBeDefined();
    expect(handler.title).toBe('====SESSION CREATED====');
    expect(handler.variant).toBe('success');
  });

  it('should return undefined for unknown event type', () => {
    const { context } = createResolvers(createUserConfig());
    const handler = context.handlers['nonexistent.event'];

    expect(handler).toBeUndefined();
  });
});

describe('events - global disabled', () => {
  it('should return enabled: false when global enabled is false', () => {
    const config = createUserConfig({
      enabled: false,
      events: { 'session.created': true },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.created');

    expect(result.enabled).toBe(false);
  });

  it('should return runOnlyOnce: true when configured', () => {
    const config = createUserConfig({
      events: {
        'session.run-once': { scripts: ['run-once.sh'], runOnlyOnce: true },
      },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.run-once');

    expect(result.runOnlyOnce).toBe(true);
  });

  it('should return runOnlyOnce: false when not configured', () => {
    const config = createUserConfig({
      events: { 'session.created': true },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.created');

    expect(result.runOnlyOnce).toBe(false);
  });
});

describe('resolveToolConfig - runOnlyOnce', () => {
  it('should return runOnlyOnce: true for tool with runOnlyOnce configured', () => {
    const config = createUserConfig({
      tools: {
        'tool.execute.after': {
          task: { runOnlyOnce: true },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.after', 'task');

    expect(result.runOnlyOnce).toBe(true);
  });

  it('should return runOnlyOnce: false for tool without runOnlyOnce', () => {
    const config = createUserConfig({
      tools: {
        'tool.execute.after': {
          chat: {},
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.after', 'chat');

    expect(result.runOnlyOnce).toBe(false);
  });
});

describe('resolveToolConfig - enabled override bug', () => {
  it('should return enabled: true when event base is false but tool has enabled: true', () => {
    const config = createUserConfig({
      default: {
        debug: false,
        toast: false,
        runScripts: false,
        runOnlyOnce: false,
        saveToFile: false,
        appendToSession: false,
      },
      events: {
        'tool.execute.before': false,
        'tool.execute.after': false,
      },
      tools: {
        'tool.execute.before': {
          skill: {
            enabled: true,
            runScripts: true,
            scripts: ['log-agent.sh'],
          },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.before', 'skill');

    expect(result.enabled).toBe(true);
    expect(result.scripts).toEqual(['log-agent.sh']);
  });

  it('should return enabled: false when event base is false and tool has enabled: false', () => {
    const config = createUserConfig({
      events: {
        'tool.execute.before': false,
      },
      tools: {
        'tool.execute.before': {
          skill: {
            enabled: false,
          },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.before', 'skill');

    expect(result.enabled).toBe(false);
  });

  it('should inherit enabled: false from event base when tool has no enabled property', () => {
    const config = createUserConfig({
      events: {
        'tool.execute.before': false,
      },
      tools: {
        'tool.execute.before': {
          skill: {
            toast: true,
          },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.before', 'skill');

    expect(result.enabled).toBe(false);
  });

  it('should return enabled: true when event base is true and tool has enabled: true', () => {
    const config = createUserConfig({
      events: {
        'tool.execute.before': true,
      },
      tools: {
        'tool.execute.before': {
          skill: {
            enabled: true,
          },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.before', 'skill');

    expect(result.enabled).toBe(true);
  });

  it('should inherit enabled: true from event base when tool has no enabled property and event is true', () => {
    const config = createUserConfig({
      events: {
        'tool.execute.before': true,
      },
      tools: {
        'tool.execute.before': {
          skill: {
            toast: true,
          },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.before', 'skill');

    expect(result.enabled).toBe(true);
  });

  it('should return DISABLED_CONFIG when tool config is exactly false', () => {
    const config = createUserConfig({
      events: {},
      tools: {
        'tool.execute.before': {
          skill: false,
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.before', 'skill');

    expect(result.enabled).toBe(false);
    expect(result.toast).toBe(false);
    expect(result.scripts).toEqual([]);
  });

  it('should fall back to eventBase when tool config is empty object', () => {
    const config = createUserConfig({
      events: {
        'tool.execute.before': true,
      },
      tools: {
        'tool.execute.before': {
          skill: {},
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.before', 'skill');

    expect(result.enabled).toBe(true);
  });

  it('should fall back to eventBase when tool not found', () => {
    const config = createUserConfig({
      events: {
        'tool.execute.before': true,
      },
      tools: {
        'tool.execute.before': {
          task: { enabled: true },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve(
      'tool.execute.before',
      'nonexistent-tool'
    );

    expect(result.enabled).toBe(true);
  });

  it('should use default config fallback when tool property is undefined', () => {
    const config = createUserConfig({
      default: {
        debug: true,
        toast: true,
        saveToFile: true,
        appendToSession: true,
        runOnlyOnce: true,
      },
      events: {
        'tool.execute.before': true,
      },
      tools: {
        'tool.execute.before': {
          skill: {
            scripts: ['test.sh'],
          },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.before', 'skill');

    expect(result.debug).toBe(true);
    expect(result.toast).toBe(true);
    expect(result.saveToFile).toBe(true);
    expect(result.appendToSession).toBe(true);
    expect(result.runOnlyOnce).toBe(true);
  });

  it('should return enabled: true when event base is undefined and tool has enabled: true', () => {
    const config = createUserConfig({
      events: {},
      tools: {
        'tool.execute.before': {
          skill: {
            enabled: true,
          },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.before', 'skill');

    expect(result.enabled).toBe(true);
  });

  it('should allow tool to override even when global enabled is false', () => {
    const config = createUserConfig({
      enabled: false,
      events: {},
      tools: {
        'tool.execute.before': {
          skill: {
            enabled: true,
          },
        },
      },
    });
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('tool.execute.before', 'skill');

    expect(result.enabled).toBe(true);
  });
});

describe('resolveEventConfig - enabled variations', () => {
  it('should return enabled: true for event config boolean true', () => {
    const config = createUserConfig({
      events: { 'session.test': true },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.test');

    expect(result.enabled).toBe(true);
  });

  it('should return enabled: false for event config boolean false', () => {
    const config = createUserConfig({
      events: { 'session.test': false },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.test');

    expect(result.enabled).toBe(false);
  });

  it('should return enabled: false for event config with enabled: false', () => {
    const config = createUserConfig({
      events: { 'session.test': { enabled: false } },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.test');

    expect(result.enabled).toBe(false);
  });

  it('should return enabled: true for event config with enabled: true', () => {
    const config = createUserConfig({
      events: { 'session.test': { enabled: true, toast: true } },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.test');

    expect(result.enabled).toBe(true);
    expect(result.toast).toBe(true);
  });

  it('should return empty string when buildMessage throws', () => {
    const config = createUserConfig({
      events: { 'session.test': {} },
    });
    const { eventResolver } = createResolvers(config, {
      'session.test': {
        title: '====TEST====',
        variant: 'info',
        duration: 2000,
        defaultScript: 'session-test.sh',
        buildMessage: () => {
          throw new Error('Build error');
        },
      },
    });
    const result = eventResolver.resolve('session.test', { test: 'data' });

    expect(result.toastMessage).toBe('');
  });

  it('getToolHandler should return undefined for invalid toolEventType', () => {
    const config = createUserConfig();
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('invalid', 'task');

    expect(result.enabled).toBe(true);
  });
});
