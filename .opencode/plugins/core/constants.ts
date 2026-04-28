import type { ResolvedEventConfig } from '../types/config';
import type { DefaultsConfig } from '../types/constants';

export const DEFAULTS: DefaultsConfig = {
  toast: {
    durations: {
      TWO_SECONDS: 2000,
      FIVE_SECONDS: 5000,
      EIGHT_SECONDS: 8000,
      TEN_SECONDS: 10000,
      FIFTEEN_SECONDS: 15000,
      THIRTY_SECONDS: 30000,
    },
    timeouts: {
      ONE_SECOND_AND_HALF: 1500,
    },
    stagger: {
      DEFAULT: 300,
      QUEUE: 500,
    },
    timer: {
      OVERWRITE_CHECK_DELAY: 2500,
      OVERWRITE_CHECK_INTERVAL: 3000,
    },
  },
  scripts: {
    dir: '.opencode/scripts',
  },
  core: {
    defaultSessionId: 'unknown',
    maxPromptLength: 10000,
    maxToastLength: 1000,
    tool: {
      TASK: 'task',
      SUBAGENT_TYPE_ARG: 'subagent_type',
    },
  },
  audit: {
    files: {
      events: 'plugin-events.json',
      scripts: 'plugin-scripts.json',
      errors: 'plugin-errors.json',
      security: 'plugin-security.json',
      debug: 'plugin-debug.json',
    },
    archiveDir: 'audit-archive',
  },
  config: {
    disabled: {
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
    } as ResolvedEventConfig,
  },
};
