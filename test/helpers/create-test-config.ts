import type { UserEventsConfig } from '.opencode/plugins/types/config';

export function createTestUserConfig(
  overrides: Partial<UserEventsConfig> = {}
): UserEventsConfig {
  return {
    enabled: true,
    logDisabledEvents: false,
    showPluginStatus: false,
    pluginStatusDisplayMode: 'user-only',
    loadClaudeHookSettings: { enabled: true },
    audit: {
      enabled: false,
      level: 'debug',
      basePath: '/tmp',
      maxSizeMB: 1,
      maxAgeDays: 1,
      logTruncationKB: 0.5,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [],
    },
    default: {
      debug: false,
      toast: false,
      runScripts: false,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: false,
    },
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
    events: {},
    tools: {
      'tool.execute.after': {},
      'tool.execute.after.subagent': {},
      'tool.execute.before': {},
    },
    ...overrides,
  } as UserEventsConfig;
}
