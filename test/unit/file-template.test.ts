import {
  resolveEventConfig,
  resolveToolConfig,
} from '../../.opencode/plugins/features/events/events';
import type { FileTemplate } from '../../.opencode/plugins/types/config';
import { _mockHandlers, _mockUserConfig } from '../fixtures';

vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../.opencode/plugins/features/messages/default-handlers', () => ({
  handlers: {
    'session.created': {
      title: '====SESSION CREATED====',
      variant: 'success',
      duration: 2000,
      defaultScript: 'session-created.sh',
      buildMessage: () => 'test',
    },
    'session.error': {
      title: '====SESSION ERROR====',
      variant: 'error',
      duration: 30000,
      defaultScript: 'session-error.sh',
      buildMessage: () => 'test',
    },
    'session.disabled': {
      title: '====DISABLED====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'session-disabled.sh',
      buildMessage: () => 'disabled',
    },
  },
}));

vi.mock('../../.opencode/plugins/config', () => ({
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
      'session.save-override': { saveToFile: false },
      'unknown.event': {
        toast: true,
        scripts: ['unknown.event.sh'],
        saveToFile: true,
        appendToSession: true,
      },
    },
    tools: {
      'tool.execute.after': {
        task: {
          toast: true,
          scripts: ['log-agent.sh'],
          runOnlyOnce: true,
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

describe('resolveSaveToFile - resolveEventConfig', () => {
  it('should return boolean true when saveToFile is not defined and default is true', () => {
    const config = resolveEventConfig('session.created');
    expect(config.saveToFile).toBe(true);
  });

  it('should return boolean false when saveToFile is set to false in event', () => {
    const config = resolveEventConfig('session.error');
    expect(config.saveToFile).toBe(false);
  });

  it('should return FileTemplate object with template when saveToFile is object with template only', async () => {
    vi.resetModules();
    vi.doMock(
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
    vi.doMock('../../.opencode/plugins/config', () => ({
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

    const { resolveEventConfig: rec } =
      await import('../../.opencode/plugins/features/events/events');
    const config = rec('session.test');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe('[{timestamp}] {properties.info.id}');
    expect(saveToFile.path).toBeUndefined();
  });

  it('should return FileTemplate object with path when saveToFile has path property', async () => {
    vi.resetModules();
    vi.doMock(
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
    vi.doMock('../../.opencode/plugins/config', () => ({
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

    const { resolveEventConfig: rec } =
      await import('../../.opencode/plugins/features/events/events');
    const config = rec('session.test');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe('log content');
    expect(saveToFile.path).toBe('/custom/path.log');
  });

  it('should return FileTemplate with enabled: true when saveToFile has enabled: true', async () => {
    vi.resetModules();
    vi.doMock(
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
    vi.doMock('../../.opencode/plugins/config', () => ({
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

    const { resolveEventConfig: rec } =
      await import('../../.opencode/plugins/features/events/events');
    const config = rec('session.test');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe('custom template');
  });

  it('should return boolean false when saveToFile has enabled: false', async () => {
    vi.resetModules();
    vi.doMock(
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
    vi.doMock('../../.opencode/plugins/config', () => ({
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

    const { resolveEventConfig: rec } =
      await import('../../.opencode/plugins/features/events/events');
    const config = rec('session.test');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe('should be ignored');
  });

  it('should fall back to default config when event does not define saveToFile', async () => {
    vi.resetModules();
    vi.doMock(
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
    vi.doMock('../../.opencode/plugins/config', () => ({
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

    const { resolveEventConfig: rec } =
      await import('../../.opencode/plugins/features/events/events');
    const config = rec('session.test');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe('default template from config');
    expect(saveToFile.path).toBe('/default/path.log');
  });

  it('should return true when event and default do not define saveToFile (uses default config)', () => {
    const config = resolveEventConfig('session.unknown');
    expect(config.saveToFile).toBe(true);
  });
});

describe('resolveSaveToFile - resolveToolConfig', () => {
  it('should return boolean true for tool with default saveToFile', () => {
    const config = resolveToolConfig('tool.execute.after', 'task');
    expect(config.saveToFile).toBe(true);
  });

  it('should return FileTemplate object when tool has saveToFile as object', async () => {
    vi.resetModules();
    vi.doMock(
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
    vi.doMock('../../.opencode/plugins/config', () => ({
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

    const { resolveToolConfig: rtc } =
      await import('../../.opencode/plugins/features/events/events');
    const config = rtc('tool.execute.after', 'task');

    const saveToFile = config.saveToFile as FileTemplate;
    expect(saveToFile.enabled).toBe(true);
    expect(saveToFile.template).toBe(
      'Tool: {input.tool} | Exit: {output.metadata.exit}'
    );
    expect(saveToFile.path).toBe('/var/log/tool-task.log');
  });

  it('should return false when tool has saveToFile: false', async () => {
    vi.resetModules();
    vi.doMock(
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
    vi.doMock('../../.opencode/plugins/config', () => ({
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

    const { resolveToolConfig: rtc } =
      await import('../../.opencode/plugins/features/events/events');
    const config = rtc('tool.execute.after', 'task');
    expect(config.saveToFile).toBe(false);
  });

  it('should return false when tool does not define saveToFile and event base also does not have it', async () => {
    vi.resetModules();
    vi.doMock(
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
    vi.doMock('../../.opencode/plugins/config', () => ({
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

    const { resolveToolConfig: rtc } =
      await import('../../.opencode/plugins/features/events/events');
    const config = rtc('tool.execute.after', 'task');
    expect(config.saveToFile).toBe(false);
  });
});

describe('defaultTemplate in EventHandler', () => {
  it('should have defaultTemplate property in EventHandler interface', async () => {
    vi.resetModules();
    vi.doMock(
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
    vi.doMock('../../.opencode/plugins/config', () => ({
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

    const { getHandler } =
      await import('../../.opencode/plugins/features/events/events');
    const handler = getHandler('session.created');

    expect(handler).toBeDefined();
    expect(handler?.defaultTemplate).toBe(
      '[{timestamp}] Session: {properties.info.id}'
    );
  });

  it('should return undefined when handler does not have defaultTemplate', async () => {
    vi.resetModules();
    vi.doMock(
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
    vi.doMock('../../.opencode/plugins/config', () => ({
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

    const { getHandler } =
      await import('../../.opencode/plugins/features/events/events');
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
