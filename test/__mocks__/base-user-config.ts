import type { ScriptToastsConfig } from '../.opencode/plugins/helpers/config';

export const defaultScriptToasts: ScriptToastsConfig = {
  showOutput: true,
  showError: true,
  outputVariant: 'info',
  errorVariant: 'error',
  outputDuration: 5000,
  errorDuration: 15000,
};

export const baseUserConfig = {
  enabled: true,
  logDisabledEvents: true,
  showPluginStatus: true,
  pluginStatusDisplayMode: 'user-only' as const,
  scriptToasts: defaultScriptToasts,
  default: {
    debug: false,
    toast: true,
    runScripts: true,
    runOnlyOnce: false,
    saveToFile: true,
    appendToSession: false,
  },
};
