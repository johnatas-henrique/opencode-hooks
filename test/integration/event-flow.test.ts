import {
  resolveEventConfig,
  resolveToolConfig,
} from '../../.opencode/plugins/features/events/events';

vi.mock('../../.opencode/plugins/features/handlers', () => ({
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

vi.mock('../../.opencode/plugins/config/settings', () => ({
  userConfig: {
    enabled: true,
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
    it('should resolve config with event-specific overrides', () => {
      const config = resolveEventConfig('session.created');

      expect(config.enabled).toBe(true);
      expect(config.toast).toBe(true);
      expect(config.toastTitle).toBe('====SESSION CREATED====');
      expect(config.logToAudit).toBe(true);
    });

    it('should resolve session.error config', () => {
      const config = resolveEventConfig('session.error');

      expect(config.enabled).toBe(true);
      expect(config.toast).toBe(true);
      expect(config.toastVariant).toBe('error');
    });

    it('should return default for unknown events', () => {
      const config = resolveEventConfig('unknown.event');

      expect(config.enabled).toBe(true);
      expect(config.toast).toBe(false);
      expect(config.logToAudit).toBe(true); // default.logToAudit is true
    });
  });

  describe('resolveToolConfig', () => {
    it('should resolve tool config with tool-specific overrides for task', () => {
      const config = resolveToolConfig('tool.execute.after', 'task');

      expect(config.enabled).toBe(true);
      expect(config.toast).toBe(true);
      expect(config.scripts).toContain('log-agent.sh');
    });

    it('should resolve tool config for skill', () => {
      const config = resolveToolConfig('tool.execute.after', 'skill');

      expect(config.enabled).toBe(true);
      expect(config.scripts).toContain('log-skill.sh');
    });

    it('should return event base config for unknown tools', () => {
      const config = resolveToolConfig('tool.execute.after', 'unknown');

      expect(config.enabled).toBe(true);
      expect(config.toast).toBe(false);
    });
  });

  describe('Event Resolution Chain', () => {
    it('should follow priority: user config > default > system', () => {
      const sessionConfig = resolveEventConfig('session.created');
      expect(sessionConfig.toastTitle).toBe('====SESSION CREATED====');
    });

    it('should merge event and tool configs correctly', () => {
      const eventConfig = resolveEventConfig('tool.execute.after');
      const toolConfig = resolveToolConfig('tool.execute.after', 'task');

      expect(eventConfig.toast).toBe(false);
      expect(toolConfig.toast).toBe(true);
      expect(toolConfig.scripts).toEqual(['log-agent.sh']);
    });
  });
});

describe('Integration: Script Execution Flow', () => {
  it('should resolve script configuration correctly', () => {
    const toolConfig = resolveToolConfig('tool.execute.after', 'task');

    expect(toolConfig.scripts).toHaveLength(1);
    expect(toolConfig.scripts[0]).toBe('log-agent.sh');
  });

  it('should handle multiple tool types with different scripts', () => {
    const taskConfig = resolveToolConfig('tool.execute.after', 'task');
    const skillConfig = resolveToolConfig('tool.execute.after', 'skill');

    expect(taskConfig.scripts).not.toEqual(skillConfig.scripts);
    expect(taskConfig.scripts[0]).toBe('log-agent.sh');
    expect(skillConfig.scripts[0]).toBe('log-skill.sh');
  });
});

describe('Integration: Toast Flow', () => {
  it('should resolve toast configuration for session events', () => {
    const config = resolveEventConfig('session.created');

    expect(config.toast).toBe(true);
    expect(config.toastVariant).toBe('success');
    expect(config.toastDuration).toBe(2000);
  });

  it('should resolve toast configuration for tool events', () => {
    const config = resolveToolConfig('tool.execute.after', 'task');

    expect(config.toast).toBe(true);
    expect(config.toastVariant).toBe('info');
  });

  it('should inherit toast settings from event base for unknown tools', () => {
    const config = resolveToolConfig('tool.execute.after', 'glob');

    expect(config.toast).toBe(false);
    expect(config.toastVariant).toBe('info');
  });
});
