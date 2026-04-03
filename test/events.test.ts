import {
  resolveEventConfig,
  resolveToolConfig,
  getHandler,
} from '../.opencode/plugins/helpers/events';

jest.mock('../.opencode/plugins/helpers/handlers', () => ({
  handlers: {
    'session.created': {
      title: '====SESSION CREATED====',
      variant: 'success',
      duration: 2000,
      defaultScript: 'session-created.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.info.id}\nTime: now`,
    },
    'session.error': {
      title: '====SESSION ERROR====',
      variant: 'error',
      duration: 30000,
      defaultScript: 'session-error.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties.sessionID}\nError: ${event.properties.error?.name || 'Unknown error'}\nTime: now`,
    },
    'server.instance.disposed': {
      title: '',
      variant: 'info',
      duration: 0,
      defaultScript: 'session-stop.sh',
      buildMessage: (event: any) =>
        `Directory: ${event.properties.directory || 'unknown'}\nTime: now`,
    },
    'tool.execute.after': {
      title: '====SUBAGENT CALLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-after.sh',
      buildMessage: (event: any) =>
        `Session Id: ${event.properties?.sessionID || 'unknown'}\nTime: now`,
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

jest.mock('../.opencode/plugins/helpers/user-events.config', () => ({
  userConfig: {
    enabled: true,
    toast: true,
    saveToFile: true,
    appendToSession: true,
    runScripts: true,
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
    },
    tools: {
      'tool.execute.after': {
        task: {
          toast: true,
          scripts: ['log-agent.sh'],
        },
        chat: { toast: false },
        'git.commit': { runScripts: false },
        disabled: false,
      },
    },
  },
}));

describe('events - resolveEventConfig', () => {
  it('should return global defaults for event not listed', () => {
    const config = resolveEventConfig('unknown.event');

    expect(config.enabled).toBe(true);
    expect(config.toast).toBe(true);
    expect(config.toastTitle).toBe('');
    expect(config.toastVariant).toBe('info');
    expect(config.toastDuration).toBe(0);
    expect(config.scripts).toEqual(['unknown.event.sh']);
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

  it('should return global defaults when event not in config', () => {
    const config = resolveEventConfig('session.unknown');

    expect(config.enabled).toBe(true);
    expect(config.toast).toBe(true);
    expect(config.saveToFile).toBe(true);
    expect(config.appendToSession).toBe(true);
  });

  it('should return empty scripts when event is boolean true and global runScripts is false', () => {
    jest.resetModules();
    jest.doMock('../.opencode/plugins/helpers/handlers', () => ({
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
    jest.doMock('../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        toast: true,
        saveToFile: true,
        appendToSession: true,
        runScripts: false,
        events: {
          'session.created': true,
        },
        tools: {},
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../.opencode/plugins/helpers/events');
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
    expect(config.scripts).toEqual(['tool-execute-after.sh']);
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
    jest.doMock('../.opencode/plugins/helpers/handlers', () => ({
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
    jest.doMock('../.opencode/plugins/helpers/user-events.config', () => ({
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
    } = require('../.opencode/plugins/helpers/events');
    const config = resolveEventConfig('session.created');

    expect(config.enabled).toBe(false);
  });
});
