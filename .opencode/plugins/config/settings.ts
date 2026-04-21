import { TOAST_DURATION } from '../core/constants';
import { EventType } from '../types/config';
import type { UserEventsConfig } from '../types/config';
import { DEFAULT_AUDIT_CONFIG } from '../types/audit';
import {
  blockEnvFiles,
  blockGitForce,
  blockScriptsFailed,
  blockByPath,
  blockNoVerify,
  blockProtectedBranch,
} from './security-rules';

export const userConfig: UserEventsConfig = {
  enabled: true,

  logDisabledEvents: false,
  showPluginStatus: true,
  pluginStatusDisplayMode: 'user-only',

  scriptToasts: {
    showOutput: true,
    showError: true,
    outputVariant: 'warning',
    errorVariant: 'error',
    outputDuration: TOAST_DURATION.FIVE_SECONDS,
    errorDuration: TOAST_DURATION.FIFTEEN_SECONDS,
    outputTitle: '- SCRIPTS OUTPUT',
    errorTitle: '- SCRIPT ERROR',
  },

  default: {
    debug: false,
    toast: false,
    runScripts: false,
    runOnlyOnce: false,
    saveToFile: true,
    appendToSession: false,
  },

  // Opinionated defaults - good for most projects
  // saveToFile: true = logs all events to production/session-logs/
  // toast: false = don't show toasts for all events (too noisy)
  // runScripts: false = scripts are opt-in, not by default

  audit: {
    enabled: true,
    level: 'debug',
    maxSizeMB: 10,
    maxAgeDays: 30,
    truncationKB: 10,
    maxFieldSize: 1000, // Max characters per field (for debug logging)
    maxArrayItems: 50, // Max items per array (for debug logging)
    files: DEFAULT_AUDIT_CONFIG.files,
  },

  events: {
    [EventType.SERVER_CONNECTED]: { enabled: false },
    [EventType.SERVER_INSTANCE_DISPOSED]: { enabled: true },

    [EventType.SESSION_CREATED]: {
      toast: true,
      runScripts: true,
      runOnlyOnce: true,
      appendToSession: true,
    },
    [EventType.SESSION_COMPACTED]: { toast: true },
    [EventType.SESSION_DELETED]: { toast: true },
    [EventType.SESSION_IDLE]: {
      toast: true,
      runScripts: true,
      scripts: ['server-connected.sh'],
    },
    [EventType.SESSION_DIFF]: { toast: true },
    [EventType.SESSION_ERROR]: { toast: true },
    [EventType.SESSION_STATUS]: { toast: true },
    [EventType.SESSION_UPDATED]: { toast: true },
    [EventType.SESSION_UNKNOWN]: { toast: true },

    [EventType.MESSAGE_PART_DELTA]: { toast: true },
    [EventType.MESSAGE_PART_REMOVED]: { toast: true },
    [EventType.MESSAGE_PART_UPDATED]: { toast: true },
    [EventType.MESSAGE_REMOVED]: { toast: true },
    [EventType.MESSAGE_UPDATED]: { toast: true },

    [EventType.FILE_EDITED]: { enabled: false },
    [EventType.FILE_WATCHER_UPDATED]: { enabled: false },

    [EventType.PERMISSION_ASKED]: { enabled: false },
    [EventType.PERMISSION_REPLIED]: { enabled: false },

    [EventType.COMMAND_EXECUTED]: { enabled: false },

    [EventType.LSP_CLIENT_DIAGNOSTICS]: { enabled: false },
    [EventType.LSP_UPDATED]: { enabled: false },

    [EventType.INSTALLATION_UPDATED]: { toast: true },

    [EventType.TODO_UPDATED]: { enabled: false },

    [EventType.SHELL_ENV]: { toast: true },

    [EventType.EXPERIMENTAL_SESSION_COMPACTING]: { toast: true },

    [EventType.CHAT_MESSAGE]: { enabled: false },
    [EventType.CHAT_PARAMS]: { enabled: false },
    [EventType.CHAT_HEADERS]: { enabled: false },
    [EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM]: { enabled: false },
    [EventType.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM]: { enabled: false },
    [EventType.EXPERIMENTAL_TEXT_COMPLETE]: { enabled: false },
    [EventType.TOOL_DEFINITION]: { enabled: false },

    [EventType.TUI_PROMPT_APPEND]: { enabled: false },
    [EventType.TUI_COMMAND_EXECUTE]: { enabled: false },

    [EventType.TUI_TOAST_SHOW]: { enabled: false },
  },

  tools: {
    [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: {
      task: {
        saveToFile: true,
      },
    },
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: {},
      skill: { saveToFile: true },
      bash: {},
      write: {},
      edit: {},
      chat: {},
      read: {},
      glob: {},
      grep: {},
      list: {},
      patch: {},
      webfetch: {},
      websearch: {},
      codesearch: {},
      todowrite: {},
      todoread: {},
      question: {},
      'git.commit': {},
      'git.push': {},
      'git.pull': {},
      filesystem_read_file: {},
      filesystem_write_file: {},
      filesystem_list_directory: {},
      filesystem_search_files: {},
      filesystem_create_directory: {},
      filesystem_move_file: {},
      filesystem_get_file_info: {},
      gh_grep_searchGitHub: {},
    },
    [EventType.TOOL_EXECUTE_BEFORE]: {
      task: {},
      skill: {},
      bash: {
        block: [
          { check: blockNoVerify, message: '🚫 --no-verify flag blocked' },
          { check: blockGitForce, message: '🚫 git --force forbidden' },
          {
            check: blockProtectedBranch,
            message: '🚫 Push to protected branch',
          },
          { check: blockScriptsFailed, message: '🚫 Blocking: scripts failed' },
        ],
      },
      write: {
        block: [
          { check: blockEnvFiles, message: '🚫 Cannot write .env files' },
        ],
      },
      read: {
        block: [
          { check: blockEnvFiles, message: '🚫 Cannot read .env files' },
          {
            check: blockByPath(['credentials.json', 'secrets/', '.ssh/']),
            message: '🚫 Protected files',
          },
        ],
      },
      edit: {},
      chat: {},
      glob: {},
      grep: {},
      list: {},
      patch: {},
      webfetch: {},
      websearch: {},
      codesearch: {},
      todowrite: {},
      todoread: {},
      question: {},
      'git.commit': {},
      'git.push': {},
      'git.pull': {},
      filesystem_read_file: {
        block: [
          { check: blockEnvFiles, message: '🚫 Cannot read .env files' },
          {
            check: blockByPath(['credentials.json', 'secrets/', '.ssh/']),
            message: '🚫 Protected files',
          },
        ],
      },
      filesystem_write_file: {},
      filesystem_list_directory: {},
      filesystem_search_files: {},
      filesystem_create_directory: {},
      filesystem_move_file: {},
      filesystem_get_file_info: {},
      gh_grep_searchGitHub: {},
    },
  },
};
