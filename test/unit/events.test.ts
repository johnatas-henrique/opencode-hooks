import {
  resolveEventConfig,
  resolveToolConfig,
  getHandler,
} from '../../.opencode/plugins/helpers/events';

jest.mock('../../.opencode/plugins/helpers/default-handlers', () => ({
  handlers: {
    'session.created': {
      title: '====SESSION CREATED====',
      variant: 'success',
      duration: 2000,
      defaultScript: 'session-created.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${String(event.properties?.info?.id)}\nTime: now`,
    },
    'session.error': {
      title: '====SESSION ERROR====',
      variant: 'error',
      duration: 30000,
      defaultScript: 'session-error.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${String(event.properties?.sessionID)}\nError: ${String(event.properties?.error?.name || 'Unknown error')}\nTime: now`,
    },
    'server.instance.disposed': {
      title: '',
      variant: 'info',
      duration: 0,
      defaultScript: 'session-stop.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Directory: ${String(event.properties?.directory || 'unknown')}\nTime: now`,
    },
    'tool.execute.after': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-after.sh',
      buildMessage: (event: Record<string, unknown>) =>
        `Session Id: ${String(event.properties?.sessionID || 'unknown')}\nTime: now`,
    },
    'session.disabled': {
      title: '====DISABLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-disabled.sh',
      buildMessage: () => 'disabled',
    },
    'session.custom': {
      title: '====CUSTOM====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-custom.sh',
      buildMessage: () => 'custom',
    },
    'session.no-scripts': {
      title: '====NO SCRIPTS====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-no-scripts.sh',
      buildMessage: () => 'no scripts',
    },
    'session.toast-off': {
      title: '====TOAST OFF====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-toast-off.sh',
      buildMessage: () => 'toast off',
    },
    'session.toast-custom': {
      title: '====TOAST CUSTOM====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-toast-custom.sh',
      buildMessage: () => 'toast custom',
    },
    'session.save-override': {
      title: '====SAVE OVERRIDE====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-save-override.sh',
      buildMessage: () => 'save override',
    },
    'session.append-override': {
      title: '====APPEND OVERRIDE====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-append-override.sh',
      buildMessage: () => 'append override',
    },
    'unknown.event': {
      title: '',
      variant: 'info',
      duration: 0,
      defaultScript: 'unknown.event.sh',
      buildMessage: () => 'unknown',
    },
    'session.unknown': {
      title: '====UNKNOWN====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-unknown.sh',
      buildMessage: () => 'unknown',
    },
  },
}));

jest.mock('../../.opencode/plugins/helpers/user-events.config', () => ({
  userConfig: {
    enabled: true,
    default: {
      debug: false,
      toast: true,
      runScripts: false,
      runOnlyOnce: false,
      saveToFile: true,
      appendToSession: true,
    },
    events: {
      'session.created': true,
      'session.error': { saveToFile: false, appendToSession: false },
      'session.disabled': false,
      'session.custom': {
        scripts: ['custom-a.sh', 'custom-b.sh'],
      },
      'session.no-scripts': {
        runScripts: false,
        scripts: ['should-be-ignored.sh'],
      },
      'session.toast-off': { toast: false },
      'session.toast-custom': {
        toast: {
          title: 'Custom Title',
          variant: 'warning',
          duration: 5000,
          message: 'Custom message',
        },
      },
      'session.save-override': { saveToFile: false },
      'session.append-override': { appendToSession: false },
      'session.run-once': { scripts: ['run-once.sh'], runOnlyOnce: true },
      'unknown.event': {
        toast: true,
        scripts: ['unknown.event.sh'],
        saveToFile: true,
        appendToSession: true,
      },
      'session.toast-defaults': { toast: true, runScripts: true },
    },
    tools: {
      'tool.execute.after': {
        task: {
          toast: true,
          scripts: ['log-agent.sh'],
          runOnlyOnce: true,
        },
        chat: { toast: false },
        'git.commit': { runScripts: false },
        disabled: false,
      },
    },
  },
}));

describe('events - resolveEventConfig', () => {
  it('should return defaults for event not listed', () => {
    const config = resolveEventConfig('session.unknown');

    expect(config.enabled).toBe(true);
    expect(config.toast).toBe(true);
    expect(config.toastTitle).toBe('====UNKNOWN====');
    expect(config.toastVariant).toBe('info');
    expect(config.toastDuration).toBe(2000);
    expect(config.scripts).toEqual([]);
    expect(config.saveToFile).toBe(true);
    expect(config.appendToSession).toBe(true);
  });

  it('should return enabled: false for event set to false', () => {
    const config = resolveEventConfig('session.disabled');

    expect(config.enabled).toBe(false);
  });

  it('should return default script for event set to boolean true', () => {
    const config = resolveEventConfig('session.created');

    expect(config.enabled).toBe(true);
    expect(config.scripts).toEqual(['session-created.sh']);
  });

  it('should return specified scripts for event with scripts array', () => {
    const config = resolveEventConfig('session.custom');

    expect(config.enabled).toBe(true);
    expect(config.scripts).toEqual(['custom-a.sh', 'custom-b.sh']);
  });

  it('should return empty scripts when runScripts: false wins over scripts', () => {
    const config = resolveEventConfig('session.no-scripts');

    expect(config.scripts).toEqual([]);
  });

  it('should return empty array when event config is boolean false', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {},
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'session.test': false,
        },
        tools: {},
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rec('session.test');

    expect(config.scripts).toEqual([]);
  });

  it('should return toast: false when default toast is object with enabled: false', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'session.test': {
          title: 'Test',
          variant: 'info',
          duration: 2000,
          buildMessage: () => 'test',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {
          toast: { enabled: false },
        },
        events: {
          'session.test': true,
        },
        tools: {},
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rec('session.test');

    expect(config.toast).toBe(false);
  });

  it('should return toast: false for event with toast: false', () => {
    const config = resolveEventConfig('session.toast-off');

    expect(config.toast).toBe(false);
  });

  it('should return custom toast settings for event with toast object', () => {
    const config = resolveEventConfig('session.toast-custom');

    expect(config.toast).toBe(true);
    expect(config.toastTitle).toBe('Custom Title');
    expect(config.toastVariant).toBe('warning');
    expect(config.toastDuration).toBe(5000);
    expect(config.toastMessage).toBe('Custom message');
  });

  it('should return custom saveToFile when overridden', () => {
    const config = resolveEventConfig('session.save-override');

    expect(config.saveToFile).toBe(false);
  });

  it('should return custom appendToSession when overridden', () => {
    const config = resolveEventConfig('session.append-override');

    expect(config.appendToSession).toBe(false);
  });

  it('should return defaults for event not in config', () => {
    const config = resolveEventConfig('session.unknown');

    expect(config.enabled).toBe(true);
    expect(config.toast).toBe(true);
    expect(config.scripts).toEqual([]);
  });

  it('should return empty scripts when event is boolean true and global runScripts is false', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'session.created': {
          title: '====SESSION CREATED====',
          variant: 'success',
          duration: 2000,
          defaultScript: 'session-created.sh',
          buildMessage: () => 'test',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        toast: true,
        saveToFile: true,
        appendToSession: true,
        events: {
          'session.created': { runScripts: false },
        },
        tools: {},
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rec('session.created');

    expect(config.enabled).toBe(true);
    expect(config.scripts).toEqual([]);
  });
});

describe('events - resolveToolConfig', () => {
  it('should return tool-specific config when found', () => {
    const config = resolveToolConfig('tool.execute.after', 'task');

    expect(config.enabled).toBe(true);
    expect(config.toast).toBe(true);
    expect(config.scripts).toEqual(['log-agent.sh']);
  });

  it('should fall back to resolveEventConfig when tool not found', () => {
    const config = resolveToolConfig('tool.execute.after', 'unknown-tool');

    expect(config.enabled).toBe(true);
    expect(config.toast).toBe(true);
    expect(config.scripts).toEqual([]); // runScripts default is false
  });

  it('should return enabled: false when tool is disabled', () => {
    const config = resolveToolConfig('tool.execute.after', 'disabled');

    expect(config.enabled).toBe(false);
  });

  it('should return toast: false for chat tool', () => {
    const config = resolveToolConfig('tool.execute.after', 'chat');

    expect(config.toast).toBe(false);
  });

  it('should return empty scripts for git.commit with runScripts: false', () => {
    const config = resolveToolConfig('tool.execute.after', 'git.commit');

    expect(config.scripts).toEqual([]);
  });
});

describe('events - getHandler', () => {
  it('should return handler for known event type', () => {
    const handler = getHandler('session.created');

    expect(handler).toBeDefined();
    expect(handler.title).toBe('====SESSION CREATED====');
    expect(handler.variant).toBe('success');
  });

  it('should return undefined for unknown event type', () => {
    const handler = getHandler('nonexistent.event');

    expect(handler).toBeUndefined();
  });
});

describe('events - global disabled', () => {
  it('should return enabled: false when global enabled is false', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'session.created': {
          title: '====SESSION CREATED====',
          variant: 'success',
          duration: 2000,
          defaultScript: 'session-created.sh',
          buildMessage: () => 'test',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: false,
        toast: true,
        saveToFile: true,
        appendToSession: true,
        runScripts: true,
        events: {
          'session.created': true,
        },
        tools: {},
      },
    }));

    const {
      resolveEventConfig,
    } = require('../../.opencode/plugins/helpers/events');
    const config = resolveEventConfig('session.created');

    expect(config.enabled).toBe(false);
  });

  it('should return runOnlyOnce: true when configured', () => {
    const config = resolveEventConfig('session.run-once');

    expect(config.runOnlyOnce).toBe(true);
  });

  it('should return runOnlyOnce: false when not configured', () => {
    const config = resolveEventConfig('session.created');

    expect(config.runOnlyOnce).toBe(false);
  });
});

describe('resolveToolConfig - runOnlyOnce', () => {
  it('should return runOnlyOnce: true for tool with runOnlyOnce configured', () => {
    const config = resolveToolConfig('tool.execute.after', 'task');

    expect(config.runOnlyOnce).toBe(true);
  });

  it('should return runOnlyOnce: false for tool without runOnlyOnce', () => {
    const config = resolveToolConfig('tool.execute.after', 'chat');

    expect(config.runOnlyOnce).toBe(false);
  });
});

describe('resolveToolConfig - enabled override bug', () => {
  it('should return enabled: true when event base is false but tool has enabled: true', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
        'tool.execute.after': {
          title: '====TOOL AFTER====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-after.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
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
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'skill');

    expect(config.enabled).toBe(true);
    expect(config.scripts).toEqual(['log-agent.sh']);
  });

  it('should return enabled: false when event base is false and tool has enabled: false', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
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
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'skill');

    expect(config.enabled).toBe(false);
  });

  it('should inherit enabled: false from event base when tool has no enabled property', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
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
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'skill');

    expect(config.enabled).toBe(false);
  });

  it('should return enabled: true when event base is true and tool has enabled: true', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
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
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'skill');

    expect(config.enabled).toBe(true);
  });

  it('should inherit enabled: true from event base when tool has no enabled property and event is true', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
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
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'skill');

    expect(config.enabled).toBe(true);
  });

  it('should return DISABLED_CONFIG when tool config is exactly false', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {},
        tools: {
          'tool.execute.before': {
            skill: false,
          },
        },
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'skill');

    expect(config.enabled).toBe(false);
    expect(config.toast).toBe(false);
    expect(config.scripts).toEqual([]);
  });

  it('should fall back to eventBase when tool config is empty object', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'tool.execute.before': true,
        },
        tools: {
          'tool.execute.before': {
            skill: {},
          },
        },
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'skill');

    expect(config.enabled).toBe(true);
  });

  it('should fall back to eventBase when tool not found', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'tool.execute.before': true,
        },
        tools: {
          'tool.execute.before': {
            task: { enabled: true },
          },
        },
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'nonexistent-tool');

    expect(config.enabled).toBe(true);
  });

  it('should use default config fallback when tool property is undefined', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
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
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'skill');

    expect(config.debug).toBe(true);
    expect(config.toast).toBe(true);
    expect(config.saveToFile).toBe(true);
    expect(config.appendToSession).toBe(true);
    expect(config.runOnlyOnce).toBe(true);
  });

  it('should return enabled: true when event base is undefined and tool has enabled: true', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {},
        tools: {
          'tool.execute.before': {
            skill: {
              enabled: true,
            },
          },
        },
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'skill');

    expect(config.enabled).toBe(true);
  });

  it('should allow tool to override even when global enabled is false (main plugin still blocks)', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: false,
        default: {},
        events: {},
        tools: {
          'tool.execute.before': {
            skill: {
              enabled: true,
            },
          },
        },
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'skill');

    expect(config.enabled).toBe(true);
  });
});

describe('resolveEventConfig - enabled variations', () => {
  it('should return enabled: true for event config boolean true', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'session.test': {
          title: '====TEST====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'session-test.sh',
          buildMessage: () => 'test',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'session.test': true,
        },
        tools: {},
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rec('session.test');

    expect(config.enabled).toBe(true);
  });

  it('should return enabled: false for event config boolean false', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'session.test': {
          title: '====TEST====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'session-test.sh',
          buildMessage: () => 'test',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'session.test': false,
        },
        tools: {},
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rec('session.test');

    expect(config.enabled).toBe(false);
  });

  it('should return enabled: false for event config with enabled: false', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'session.test': {
          title: '====TEST====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'session-test.sh',
          buildMessage: () => 'test',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'session.test': { enabled: false },
        },
        tools: {},
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rec('session.test');

    expect(config.enabled).toBe(false);
  });

  it('should return enabled: true for event config with enabled: true', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'session.test': {
          title: '====TEST====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'session-test.sh',
          buildMessage: () => 'test',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'session.test': { enabled: true, toast: true },
        },
        tools: {},
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rec('session.test');

    expect(config.enabled).toBe(true);
    expect(config.toast).toBe(true);
  });
});
