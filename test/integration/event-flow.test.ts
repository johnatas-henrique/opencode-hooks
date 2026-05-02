import {
  resolveEventConfig,
  resolveToolConfig,
} from '.opencode/plugins/features/events/events';

vi.mock('.opencode/plugins/features/handlers', () => ({
  handlers: {
    'session.created': {
      title: '====SESSION CREATED====',
      variant: 'success',
      duration: 2000,
      defaultScript: 'session-created.sh',
      buildMessage: () => 'Session created',
    },
    'session.error': {
      title: '====SESSION ERROR====',
      variant: 'error',
      duration: 30000,
      defaultScript: 'session-error.sh',
      buildMessage: () => 'Session error',
    },
    'tool.execute.after': {
      title: '====TOOL AFTER====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool-execute-after.sh',
      buildMessage: () => 'Tool executed',
    },
  },
}));

vi.mock('.opencode/plugins/config/settings', () => ({
  userConfig: {
    enabled: true,
    loadClaudeHookSettings: { enabled: false },
    scriptToasts: {
      showOutput: true,
      showError: true,
      outputVariant: 'info',
      errorVariant: 'error',
      outputDuration: 5000,
      errorDuration: 15000,
      outputTitle: 'Output',
      errorTitle: 'Error',
    },
    showPluginStatus: false,
    pluginStatusDisplayMode: 'user-only',
    default: {
      debug: false,
      toast: false,
      runScripts: false,
      runOnlyOnce: false,
      logToAudit: false,
      appendToSession: false,
    },
    events: {
      'session.created': { toast: true, logToAudit: true },
      'session.error': { toast: true },
      'session.compacted': { toast: true, scripts: ['pre-compact.sh'] },
      'tool.execute.after': { toast: false },
    },
    tools: {
      'tool.execute.after': {
        task: { toast: true, scripts: ['log-agent.sh'] },
        skill: { toast: true, scripts: ['log-skill.sh'] },
      },
    },
  },
}));

describe('Integration: Event Flow', () => {
  describe('resolveEventConfig', () => {
    it('should return default for unknown events', () => {
      const config = resolveEventConfig('unknown.event');

      expect(config.enabled).toBe(true);
      expect(config.toast).toBe(false);
      expect(config.logToAudit).toBe(true);
    });
  });
});

describe('Integration: Toast Flow', () => {
  it('should inherit toast settings from event base for unknown tools', () => {
    const config = resolveToolConfig('tool.execute.after', 'glob');

    expect(config.toast).toBe(false);
    expect(config.toastVariant).toBe('info');
  });
});
