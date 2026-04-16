import { EventType } from '../../.opencode/plugins/types/config';
import type {
  UserEventsConfig,
  EventConfig,
  ToolConfig,
} from '../../.opencode/plugins/types/config';

const baseConfig: UserEventsConfig = {
  enabled: true,
  logDisabledEvents: false,
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
    saveToFile: true,
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
  eventType: EventType,
  toolName: string,
  config: ToolConfig
): Partial<UserEventsConfig> {
  return {
    tools: {
      [EventType.TOOL_EXECUTE_AFTER]: {},
      [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: {},
      [EventType.TOOL_EXECUTE_BEFORE]: {},
      [eventType]: {
        [toolName]: config,
      },
    } as UserEventsConfig['tools'],
  };
}
