export const TOAST_DURATION = {
  SHORT: 2000,
  LONG: 30000,
} as const;

export const STAGGER_MS = {
  DEFAULT: 300,
  QUEUE: 500,
} as const;

export const LOG_FILE = './session_events.log';
export const LOG_DIR = './production/session-logs';

export const SCRIPTS_DIR = '.opencode/scripts';

export const MAX_PROMPT_LENGTH = 10000;
