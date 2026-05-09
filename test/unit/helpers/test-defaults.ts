import type {
  EventVariant,
  EventOverride,
} from '.opencode/plugins/types/config';
import type {
  EventHandler,
  ConfigResolverContext,
  EventConfigResolver,
  ToolConfigResolver,
} from '.opencode/plugins/types/events';

export const MOCK_TITLE = 'test-title';
export const MOCK_VARIANT: EventVariant = 'info';
export const MOCK_DURATION = 5000;
export const MOCK_SCRIPT = 'test-script.sh';
export const MOCK_EVENT_TYPE = 'session.created';
export const MOCK_TOOL_NAME = 'bash';
export const MOCK_SESSION_ID = 'ses_test123';
export const MOCK_TIMESTAMP = '2026-01-01T00:00:00.000Z';

export function createDefaultEventOverride(): EventOverride {
  return {
    toast: false,
    runScripts: false,
    runOnlyOnce: false,
    logToAudit: true,
    appendToSession: false,
  };
}

export function createMinimalHandler(
  overrides?: Partial<EventHandler>
): EventHandler {
  return {
    title: MOCK_TITLE,
    variant: MOCK_VARIANT,
    duration: MOCK_DURATION,
    defaultScript: MOCK_SCRIPT,
    buildMessage: () => 'test-message',
    ...overrides,
  };
}

export function createDefaultContext(
  overrides?: Partial<ConfigResolverContext>
): ConfigResolverContext {
  return {
    enabled: true,
    default: createDefaultEventOverride(),
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
    handlers: {},
    onUnknownEvent: () => {},
    getEventConfig: () => undefined,
    getToolConfigs: () => undefined,
    getProjectDir: () => '/tmp/test',
    getClaudeScripts: (_projectDir: string) => ({}),
    ...overrides,
  };
}

export class MockEventResolver implements EventConfigResolver {
  resolve() {
    return {
      enabled: true,
      toast: false,
      toastTitle: '',
      toastMessage: '',
      toastVariant: 'info' as EventVariant,
      toastDuration: 2000,
      scripts: [],
      runScripts: false,
      logToAudit: true,
      appendToSession: false,
      runOnlyOnce: false,
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
    };
  }
}

export class MockToolResolver implements ToolConfigResolver {
  resolve() {
    return {
      enabled: true,
      toast: false,
      toastTitle: '',
      toastMessage: '',
      toastVariant: 'info' as EventVariant,
      toastDuration: 2000,
      scripts: [],
      runScripts: false,
      logToAudit: true,
      appendToSession: false,
      runOnlyOnce: false,
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
    };
  }
}
