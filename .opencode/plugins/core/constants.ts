import type { ResolvedEventConfig } from '../types/config';

export const DEFAULT_SESSION_ID = 'unknown';

export const TOAST_DURATION = {
  TWO_SECONDS: 2000,
  FIVE_SECONDS: 5000,
  EIGHT_SECONDS: 8000,
  TEN_SECONDS: 10000,
  FIFTEEN_SECONDS: 15000,
  THIRTY_SECONDS: 30000,
} as const;

export const TIMEOUT = {
  ONE_SECOND_AND_HALF: 1500,
} as const;

export const STAGGER_MS = {
  DEFAULT: 300,
  QUEUE: 500,
} as const;

export const TIMER = {
  OVERWRITE_CHECK_DELAY: 2500,
  OVERWRITE_CHECK_INTERVAL: 3000,
} as const;

// Audit file names (used by audit system)
export const AUDIT_EVENTS_FILE = 'plugin-events.json';
export const AUDIT_SCRIPTS_FILE = 'plugin-scripts.json';
export const AUDIT_ERRORS_FILE = 'plugin-errors.json';
export const AUDIT_SECURITY_FILE = 'plugin-security.json';
export const AUDIT_DEBUG_FILE = 'plugin-debug.json';
export const AUDIT_ARCHIVE_DIR = 'audit-archive';

export const MAX_PROMPT_LENGTH = 10000;

export const TOOL = {
  TASK: 'task',
  SUBAGENT_TYPE_ARG: 'subagent_type',
} as const;

export const SCRIPTS_DIR = 'scripts';

export const MAX_TOAST_LENGTH = 1000;

export const DISABLED_CONFIG: ResolvedEventConfig = {
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
    outputDuration: TOAST_DURATION.FIVE_SECONDS,
    errorDuration: TOAST_DURATION.FIFTEEN_SECONDS,
    outputTitle: 'Script Output',
    errorTitle: 'Script Error',
  },
};
