import { EventType } from '.opencode/plugins/types/events';
import type {
  UserEventsConfig,
  EventConfig,
  ToolOverride,
} from '.opencode/plugins/types/config';
import type { AuditConfig } from '.opencode/plugins/types/audit';

export function createAuditConfig(
  overrides: Partial<AuditConfig> = {}
): AuditConfig {
  return {
    enabled: true,
    level: 'debug',
    basePath: '/tmp/audit-test',
    maxSizeMB: 10,
    maxAgeDays: 30,
    logTruncationKB: 0.5,
    maxFieldSize: 1000,
    maxArrayItems: 50,
    largeFields: [],
    files: {
      events: 'plugin-events.json',
      scripts: 'plugin-scripts.json',
      errors: 'plugin-errors.json',
      security: 'plugin-security.json',
      debug: 'plugin-debug.json',
    },
    ...overrides,
  };
}

const baseConfig: UserEventsConfig = {
  enabled: true,
  logDisabledEvents: false,
  audit: {
    enabled: true,
    level: 'debug',
    basePath: '/tmp/audit-test',
    maxSizeMB: 10,
    maxAgeDays: 30,
    logTruncationKB: 0.5,
    maxFieldSize: 1000,
    maxArrayItems: 50,
    largeFields: [],
    files: {
      events: 'plugin-events.json',
      scripts: 'plugin-scripts.json',
      errors: 'plugin-errors.json',
      security: 'plugin-security.json',
      debug: 'plugin-debug.json',
    },
  },
  showPluginStatus: true,
  pluginStatusDisplayMode: 'user-only',
  scriptToasts: {
    showOutput: true,
    showError: true,
    outputVariant: 'warning',
    errorVariant: 'error',
    outputDuration: 5000,
    errorDuration: 15000,
    outputTitle: '- SCRIPTS OUTPUT',
    errorTitle: '- SCRIPT ERROR',
  },
  default: {
    debug: false,
    toast: true,
    runScripts: false,
    runOnlyOnce: false,
    logToAudit: true,
    appendToSession: true,
  },
  loadClaudeHookSettings: { enabled: false },
  events: {},
  tools: {
    [EventType.TOOL_EXECUTE_AFTER]: {},
    [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: {},
    [EventType.TOOL_EXECUTE_BEFORE]: {},
  },
};

export function createUserConfig(
  overrides: Partial<UserEventsConfig> = {}
): UserEventsConfig {
  return {
    ...baseConfig,
    default: { ...baseConfig.default, ...overrides.default },
    events: { ...baseConfig.events, ...overrides.events },
    tools: {
      ...baseConfig.tools,
      [EventType.TOOL_EXECUTE_AFTER]: {
        ...baseConfig.tools[EventType.TOOL_EXECUTE_AFTER],
        ...(overrides.tools?.[EventType.TOOL_EXECUTE_AFTER] || {}),
      },
      [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: {
        ...baseConfig.tools[EventType.TOOL_EXECUTE_AFTER_SUBAGENT],
        ...(overrides.tools?.[EventType.TOOL_EXECUTE_AFTER_SUBAGENT] || {}),
      },
      [EventType.TOOL_EXECUTE_BEFORE]: {
        ...baseConfig.tools[EventType.TOOL_EXECUTE_BEFORE],
        ...(overrides.tools?.[EventType.TOOL_EXECUTE_BEFORE] || {}),
      },
    },
    ...overrides,
  };
}

export function withEvent(
  eventType: string,
  config: EventConfig
): Partial<UserEventsConfig> {
  return {
    events: { [eventType]: config } as UserEventsConfig['events'],
  };
}

export function withToolEvent(
  _eventType: EventType,
  toolName: string,
  config: ToolOverride | Record<string, never>
): Partial<UserEventsConfig> {
  const tools: UserEventsConfig['tools'] = {
    [EventType.TOOL_EXECUTE_AFTER]: {},
    [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: {},
    [EventType.TOOL_EXECUTE_BEFORE]: {
      [toolName]: config,
    },
  };

  return { tools };
}
