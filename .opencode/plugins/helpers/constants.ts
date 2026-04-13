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

export const LOG_FILE = 'session_events.log';
export const DEBUG_LOG_FILE = 'session_debug_events.log';
export const UNKNOWN_EVENT_LOG_FILE = 'session_unknown_events.log';
export const BLOCKED_EVENTS_LOG_FILE = 'blocked-events.log';
export const LOG_DIR = './production/session-logs';

export const SCRIPTS_DIR = '.opencode/scripts';

export const MAX_PROMPT_LENGTH = 10000;
