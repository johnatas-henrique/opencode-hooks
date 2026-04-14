describe('resolveToolConfig - scripts population', () => {
  it('should include handler defaultScript in scripts when runScripts is true', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.after': {
          title: 'TOOL AFTER',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-after.sh',
          buildMessage: () => 'test',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/config/index', () => ({
      userConfig: {
        enabled: true,
        default: { runScripts: true },
        events: {},
        tools: {},
      },
    }));

    const {
      resolveToolConfig,
    } = require('../../.opencode/plugins/helpers/events');
    const config = resolveToolConfig('tool.execute.after', 'bash');

    expect(config.scripts).toContain('tool-execute-after.sh');
    expect(config.scripts).toHaveLength(1);
  });

  it('should return empty scripts when runScripts is false', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.after': {
          title: 'TOOL AFTER',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-after.sh',
          buildMessage: () => 'test',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/config/index', () => ({
      userConfig: {
        enabled: true,
        default: { runScripts: false },
        events: {},
        tools: {},
      },
    }));

    const {
      resolveToolConfig,
    } = require('../../.opencode/plugins/helpers/events');
    const config = resolveToolConfig('tool.execute.after', 'bash');

    expect(config.scripts).toHaveLength(0);
  });

  it('should return empty scripts when handler has no defaultScript', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.after': {
          title: 'TOOL AFTER',
          variant: 'info',
          duration: 2000,
          buildMessage: () => 'test',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/config/index', () => ({
      userConfig: {
        enabled: true,
        default: { runScripts: true },
        events: {},
        tools: {},
      },
    }));

    const {
      resolveToolConfig,
    } = require('../../.opencode/plugins/helpers/events');
    const config = resolveToolConfig('tool.execute.after', 'bash');

    expect(config.scripts).toHaveLength(0);
  });
});
