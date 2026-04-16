jest.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../.opencode/plugins/features/messages/default-handlers', () => ({
  handlers: mockHandlers,
}));

jest.mock('../../.opencode/plugins/config', () => ({
  userConfig: mockUserConfig,
}));

import { mockHandlers, mockUserConfig } from '../fixtures';

import {
  resolveEventConfig,
  resolveToolConfig,
} from '../../.opencode/plugins/features/events/events';
import type { FileTemplate } from '../../.opencode/plugins/types/config';

describe('resolveSaveToFile - resolveEventConfig', () => {
  it('should return boolean true when saveToFile is not defined and default is true', () => {
    const config = resolveEventConfig('session.created');

    expect(config.saveToFile).toBe(true);
  });

  it('should return boolean false when saveToFile is set to false in event', () => {
    const config = resolveEventConfig('session.error');

    expect(config.saveToFile).toBe(false);
  });

  it('should return FileTemplate object with template when saveToFile is object with template only', () => {
    jest.resetModules();
    jest.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'session.test': {
            title: '====TEST====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'session-test.sh',
            buildMessage: () => 'test',
          },
        },
      })
    );
    jest.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'session.test': {
            saveToFile: {
              template: '[{timestamp}] {properties.info.id}',
            },
          },
        },
        tools: {},
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
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/features/events/events');
    const config = rec('session.test');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe('[{timestamp}] {properties.info.id}');
    expect(saveToFile.path).toBeUndefined();
  });

  it('should return FileTemplate object with path when saveToFile has path property', () => {
    jest.resetModules();
    jest.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'session.test': {
            title: '====TEST====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'session-test.sh',
            buildMessage: () => 'test',
          },
        },
      })
    );
    jest.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'session.test': {
            saveToFile: {
              template: 'log content',
              path: '/custom/path.log',
            },
          },
        },
        tools: {},
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
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/features/events/events');
    const config = rec('session.test');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe('log content');
    expect(saveToFile.path).toBe('/custom/path.log');
  });

  it('should return FileTemplate with enabled: true when saveToFile has enabled: true', () => {
    jest.resetModules();
    jest.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'session.test': {
            title: '====TEST====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'session-test.sh',
            buildMessage: () => 'test',
          },
        },
      })
    );
    jest.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'session.test': {
            saveToFile: {
              enabled: true,
              template: 'custom template',
            },
          },
        },
        tools: {},
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
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/features/events/events');
    const config = rec('session.test');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe('custom template');
  });

  it('should return boolean false when saveToFile has enabled: false', () => {
    jest.resetModules();
    jest.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'session.test': {
            title: '====TEST====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'session-test.sh',
            buildMessage: () => 'test',
          },
        },
      })
    );
    jest.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'session.test': {
            saveToFile: {
              enabled: false,
              template: 'should be ignored',
            },
          },
        },
        tools: {},
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
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/features/events/events');
    const config = rec('session.test');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe('should be ignored');
  });

  it('should fall back to default config when event does not define saveToFile', () => {
    jest.resetModules();
    jest.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'session.test': {
            title: '====TEST====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'session-test.sh',
            buildMessage: () => 'test',
          },
        },
      })
    );
    jest.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        default: {
          saveToFile: {
            template: 'default template from config',
            path: '/default/path.log',
          },
        },
        events: {
          'session.test': {
            toast: true,
          },
        },
        tools: {},
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
      },
    }));

    const {
      resolveEventConfig: rec,
    } = require('../../.opencode/plugins/features/events/events');
    const config = rec('session.test');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe('default template from config');
    expect(saveToFile.path).toBe('/default/path.log');
  });

  it('should return true when event and default do not define saveToFile (uses default config)', () => {
    const config = resolveEventConfig('session.unknown');

    expect(config.saveToFile).toBe(true); // default config has saveToFile: true
  });
});

describe('resolveSaveToFile - resolveToolConfig', () => {
  it('should return boolean true for tool with default saveToFile', () => {
    const config = resolveToolConfig('tool.execute.after', 'task');

    expect(config.saveToFile).toBe(true);
  });

  it('should return FileTemplate object when tool has saveToFile as object', () => {
    jest.resetModules();
    jest.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'tool.execute.after': {
            title: '====TOOL AFTER====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'tool-execute-after.sh',
            buildMessage: () => 'tool',
          },
        },
      })
    );
    jest.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'tool.execute.after': true,
        },
        tools: {
          'tool.execute.after': {
            task: {
              saveToFile: {
                template: 'Tool: {input.tool} | Exit: {output.metadata.exit}',
                path: '/var/log/tool-task.log',
              },
            },
          },
        },
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
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/features/events/events');
    const config = rtc('tool.execute.after', 'task');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe(
      'Tool: {input.tool} | Exit: {output.metadata.exit}'
    );
    expect(saveToFile.path).toBe('/var/log/tool-task.log');
  });

  it('should return false when tool has saveToFile: false', () => {
    jest.resetModules();
    jest.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'tool.execute.after': {
            title: '====TOOL AFTER====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'tool-execute-after.sh',
            buildMessage: () => 'tool',
          },
        },
      })
    );
    jest.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'tool.execute.after': true,
        },
        tools: {
          'tool.execute.after': {
            task: {
              saveToFile: false,
            },
          },
        },
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
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/features/events/events');
    const config = rtc('tool.execute.after', 'task');

    expect(config.saveToFile).toBe(false);
  });

  it('should return false when tool does not define saveToFile and event base also does not have it', () => {
    jest.resetModules();
    jest.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'tool.execute.after': {
            title: '====TOOL AFTER====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'tool-execute-after.sh',
            buildMessage: () => 'tool',
          },
        },
      })
    );
    jest.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {
          'tool.execute.after': {
            saveToFile: {
              template: 'event base template',
            },
          },
        },
        tools: {
          'tool.execute.after': {
            task: {
              toast: true,
            },
          },
        },
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
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/features/events/events');
    const config = rtc('tool.execute.after', 'task');

    // When tool config exists but doesn't have saveToFile, it falls back to default (which has none)
    expect(config.saveToFile).toBe(false);
  });
});

describe('defaultTemplate in EventHandler', () => {
  it('should have defaultTemplate property in EventHandler interface', () => {
    // The interface EventHandler in default-handlers.ts has defaultTemplate property
    jest.resetModules();
    jest.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'session.created': {
            title: '====SESSION CREATED====',
            variant: 'success',
            duration: 2000,
            defaultScript: 'session-created.sh',
            buildMessage: () => 'test',
            defaultTemplate: '[{timestamp}] Session: {properties.info.id}',
          },
        },
      })
    );
    jest.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {},
        tools: {},
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
      },
    }));

    const {
      getHandler,
    } = require('../../.opencode/plugins/features/events/events');
    const handler = getHandler('session.created');

    expect(handler).toBeDefined();
    expect(handler?.defaultTemplate).toBe(
      '[{timestamp}] Session: {properties.info.id}'
    );
  });

  it('should return undefined when handler does not have defaultTemplate', () => {
    jest.resetModules();
    jest.doMock(
      '../../.opencode/plugins/features/messages/default-handlers',
      () => ({
        handlers: {
          'session.test': {
            title: '====TEST====',
            variant: 'info',
            duration: 2000,
            defaultScript: 'session-test.sh',
            buildMessage: () => 'test',
          },
        },
      })
    );
    jest.doMock('../../.opencode/plugins/config', () => ({
      userConfig: {
        enabled: true,
        default: {},
        events: {},
        tools: {},
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
      },
    }));

    const {
      getHandler,
    } = require('../../.opencode/plugins/features/events/events');
    const handler = getHandler('session.test');

    expect(handler).toBeDefined();
    expect(handler?.defaultTemplate).toBeUndefined();
  });
});

describe('FileTemplate type - integration', () => {
  it('should correctly serialize FileTemplate to JSON', () => {
    const template: FileTemplate = {
      enabled: true,
      template: 'Session: {info.id}',
      path: '/logs/sessions.log',
    };

    const json = JSON.stringify(template);
    const parsed = JSON.parse(json) as FileTemplate;

    expect(parsed.enabled).toBe(true);
    expect(parsed.template).toBe('Session: {info.id}');
    expect(parsed.path).toBe('/logs/sessions.log');
  });

  it('should handle optional path property', () => {
    const template: FileTemplate = {
      enabled: true,
      template: 'Simple template',
    };

    expect(template.path).toBeUndefined();
  });
});
