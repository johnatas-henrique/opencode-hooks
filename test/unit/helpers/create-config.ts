import type {
  UserEventsConfig,
  EventVariant,
} from '.opencode/plugins/types/config';

export function createUserConfig(
  overrides?: Partial<UserEventsConfig>
): UserEventsConfig {
  return {
    enabled: true,
    logDisabledEvents: false,
    showPluginStatus: true,
    pluginStatusDisplayMode: 'user-only',
    scriptToasts: {
      showOutput: true,
      showError: true,
      outputVariant: 'info' as EventVariant,
      errorVariant: 'error' as EventVariant,
      outputDuration: 5000,
      errorDuration: 15000,
      outputTitle: 'Script Output',
      errorTitle: 'Script Error',
    },
    loadClaudeHookSettings: { enabled: false },
    default: {
      debug: false,
      toast: false,
      runScripts: false,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: false,
    },
    audit: {
      enabled: true,
      level: 'debug',
      basePath: '/tmp/test-audit',
      maxSizeMB: 1,
      maxAgeDays: 30,
      logTruncationKB: 10,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [
        'patch',
        'diff',
        'content',
        'snapshot',
        'output',
        'result',
        'text',
      ],
    },
    events: {},
    tools: {
      'tool.execute.after': {},
      'tool.execute.after.subagent': {},
      'tool.execute.before': {},
    },
    ...overrides,
  };
}
