export const TOAST_DEFAULTS = {
  durations: { TEN_SECONDS: 10000, TWO_SECONDS: 2000, FIVE_SECONDS: 5000 },
  timeouts: { ONE_SECOND_AND_HALF: 1500 },
  stagger: { DEFAULT: 300, QUEUE: 500 },
  timer: { OVERWRITE_CHECK_DELAY: 2500, OVERWRITE_CHECK_INTERVAL: 3000 },
};

export const SCRIPTS_DEFAULTS = { dir: '.opencode/scripts' };

export const CORE_DEFAULTS = {
  defaultSessionId: 'unknown',
  maxPromptLength: 10000,
  maxToastLength: 1000,
  tool: { TASK: 'task', SUBAGENT_TYPE_ARG: 'subagent_type' },
};

export const AUDIT_DEFAULTS = {
  files: {
    events: 'plugin-events.json',
    scripts: 'plugin-scripts.json',
    errors: 'plugin-errors.json',
    security: 'plugin-security.json',
    debug: 'plugin-debug.json',
  },
  archiveDir: 'audit-archive',
};

export const DISABLED_CONFIG_DEFAULTS = {
  enabled: false,
  debug: false,
  toast: false,
  toastTitle: '',
  toastMessage: '',
  toastVariant: 'info',
  toastDuration: 0,
  scripts: [],
  runScripts: false,
  logToAudit: false,
  appendToSession: false,
  runOnlyOnce: false,
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
};
