import type { FileTemplate } from '../../.opencode/plugins/types/config';

vi.mock('../../.opencode/plugins/features/handlers', () => ({
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
      logToAudit: true,
      appendToSession: true,
    },
    events: {
      'session.created': true,
      'session.error': { logToAudit: false, appendToSession: false },
      'session.disabled': false,
      'session.custom': {
        scripts: ['custom-a.sh', 'custom-b.sh'],
      },
      'session.no-scripts': {
        runScripts: false,
        scripts: ['should-be-ignored.sh'],
      },
      'session.toast-off': { toast: false },
      'session.save-override': { logToAudit: false },
      'unknown.event': {
        toast: true,
        scripts: ['unknown.event.sh'],
        logToAudit: true,
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

describe('resolveLogToAudit - resolveToolConfig', () => {
  it('should return false when tool does not define logToAudit and event base also does not have it', async () => {
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
          'tool.execute.after': {},
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
    expect(config.logToAudit).toBe(true);
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
