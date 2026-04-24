import { EventType } from '../../.opencode/plugins/types/config';
import type {
  UserEventsConfig,
  EventConfig,
  ToolOverride,
} from '../../.opencode/plugins/types/config';

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
