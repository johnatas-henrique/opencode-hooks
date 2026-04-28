import type {
  EventOverride,
  ToolOverride,
  ScriptToastsConfig,
} from '../../.opencode/plugins/types/config';

export const defaultScriptToasts: ScriptToastsConfig = {
  showOutput: true,
  showError: true,
  outputVariant: 'info',
  errorVariant: 'error',
  outputDuration: 5000,
  errorDuration: 15000,
  outputTitle: 'SCRIPTS OUTPUT',
  errorTitle: 'SCRIPT ERROR',
};

export const createUserConfigWithScripts = (
  overrides?: Partial<{
    events: Record<string, EventOverride>;
    tools: Record<string, ToolOverride>;
    scriptToasts: ScriptToastsConfig;
  }>
): {
  enabled: boolean;
  logDisabledEvents: boolean;
  showPluginStatus: boolean;
  pluginStatusDisplayMode: string;
  toast: boolean;
  logToAudit: boolean;
  appendToSession: boolean;
  runScripts: boolean;
  scriptToasts: ScriptToastsConfig;
  events: Record<string, EventOverride>;
  tools: Record<string, ToolOverride>;
} => ({
  enabled: true,
  logDisabledEvents: true,
  showPluginStatus: true,
  pluginStatusDisplayMode: 'user-only',
  toast: true,
  logToAudit: true,
  appendToSession: true,
  runScripts: true,
  scriptToasts: defaultScriptToasts,
  events: {},
  tools: {},
  ...overrides,
});
