describe('resolveToolConfig - tool handler precedence', () => {
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
    jest.doMock('../../.opencode/plugins/helpers/config/index', () => ({
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

  it('should use tool-specific handler when it exists', () => {
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
        'tool.execute.after.skill': {
          title: '====SKILL AFTER====',
          variant: 'success',
          duration: 10000,
          defaultScript: 'tool-execute-after-skill.sh',
          buildMessage: () => 'skill',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/config/index', () => ({
      userConfig: {
        enabled: true,
        default: { toast: true },
        events: {},
        tools: {
          'tool.execute.after': {
            skill: {},
          },
        },
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.after', 'skill');

    expect(config.toastTitle).toBe('====SKILL AFTER====');
    expect(config.toastVariant).toBe('success');
    expect(config.toastDuration).toBe(10000);
  });

  it('should use before handler when toolEventType is before', () => {
    jest.resetModules();
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.before': {
          title: '====TOOL BEFORE====',
          variant: 'warning',
          duration: 2000,
          defaultScript: 'tool-execute-before.sh',
          buildMessage: () => 'tool',
        },
        'tool.execute.before.bash': {
          title: '====BASH BEFORE====',
          variant: 'warning',
          duration: 3000,
          defaultScript: 'tool-execute-before-bash.sh',
          buildMessage: () => 'bash',
        },
      },
    }));
    jest.doMock('../../.opencode/plugins/helpers/config/index', () => ({
      userConfig: {
        enabled: true,
        default: { toast: true },
        events: {},
        tools: {
          'tool.execute.before': {
            bash: {},
          },
        },
      },
    }));

    const {
      resolveToolConfig: rtc,
    } = require('../../.opencode/plugins/helpers/events');
    const config = rtc('tool.execute.before', 'bash');

    expect(config.toastTitle).toBe('====BASH BEFORE====');
    expect(config.toastVariant).toBe('warning');
    expect(config.toastDuration).toBe(3000);
  });
});
