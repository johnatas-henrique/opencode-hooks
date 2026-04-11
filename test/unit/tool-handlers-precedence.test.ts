describe('resolveToolConfig - tool handler precedence', () => {
  it('should use tool handler title when tool config is empty', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.after': {
          title: '====TOOL AFTER====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-after.sh',
          buildMessage: () => 'tool',
        },
        'tool:read': {
          title: '====FILE READ====',
          variant: 'info',
          duration: 3000,
          defaultScript: 'tool-execute-after-read.sh',
          buildMessage: () => 'file read',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: { toast: true },
        events: {},
        tools: {
          'tool.execute.after': {
            read: {},
          },
        },
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.after', 'read');

    expect(config.toastTitle).toBe('====FILE READ====');
    expect(config.toastDuration).toBe(3000);
  });

  it('should use tool handler title when tool config is not defined', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.after': {
          title: '====TOOL AFTER====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-after.sh',
          buildMessage: () => 'tool',
        },
        'tool:bash': {
          title: '====TERMINAL COMMAND====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-after-bash.sh',
          buildMessage: () => 'bash',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: { toast: true },
        events: {},
        tools: {
          'tool.execute.after': {
            someTool: { enabled: true },
          },
        },
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.after', 'bash');

    expect(config.toastTitle).toBe('====TERMINAL COMMAND====');
  });

  it('should let user config override tool handler title', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.after': {
          title: '====TOOL AFTER====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-after.sh',
          buildMessage: () => 'tool',
        },
        'tool:read': {
          title: '====FILE READ====',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-after-read.sh',
          buildMessage: () => 'file read',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: { toast: true },
        events: {},
        tools: {
          'tool.execute.after': {
            read: { toast: { title: '====CUSTOM READ====' } },
          },
        },
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.after', 'read');

    expect(config.toastTitle).toBe('====CUSTOM READ====');
  });

  it('should fall back to event handler when tool handler missing', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.after': {
          title: '====TOOL AFTER====',
          variant: 'success',
          duration: 4000,
          defaultScript: 'tool-execute-after.sh',
          buildMessage: () => 'tool',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: { toast: true },
        events: {},
        tools: {
          'tool.execute.after': {
            unknownTool: {},
          },
        },
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.after', 'unknownTool');

    expect(config.toastTitle).toBe('====TOOL AFTER====');
    expect(config.toastVariant).toBe('success');
    expect(config.toastDuration).toBe(4000);
  });
});
