import { DEFAULTS } from '../core/constants';
import { EventType } from '../types/events';
import type { UserEventsConfig } from '../types/config';
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
    outputDuration: DEFAULTS.toast.durations.FIVE_SECONDS,
    errorDuration: DEFAULTS.toast.durations.FIFTEEN_SECONDS,
    outputTitle: '- SCRIPTS OUTPUT',
    errorTitle: '- SCRIPT ERROR',
  },

  default: {
    debug: false,
    toast: false,
    runScripts: false,
    runOnlyOnce: false,
    logToAudit: true,
    appendToSession: false,
  },

  // Opinionated defaults - good for most projects
  // logToAudit: true = logs all events to audit system
  // toast: false = don't show toasts for all events (too noisy)
  // runScripts: false = scripts are opt-in, not by default

  audit: {
    enabled: true,
    level: 'debug',
    basePath: './production/session-logs',
    maxSizeMB: 3,
    maxAgeDays: 30,
    logTruncationKB: 0.5,
    maxFieldSize: 1000,
    maxArrayItems: 50,
    largeFields: [
      'patch',
      'diff',
      'content',
      'snapshot',
      'output',
      'result',
      'text',
    ],
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
    [EventType.SESSION_IDLE]: { toast: true },
    [EventType.SESSION_DIFF]: { enabled: false },
    [EventType.SESSION_ERROR]: { toast: true },
    [EventType.SESSION_STATUS]: { enabled: false },
    [EventType.SESSION_UPDATED]: { enabled: false },
    [EventType.SESSION_UNKNOWN]: { toast: true },

    [EventType.MESSAGE_PART_DELTA]: { enabled: false },
    [EventType.MESSAGE_PART_REMOVED]: { enabled: false },
    [EventType.MESSAGE_PART_UPDATED]: { enabled: false },
    [EventType.MESSAGE_REMOVED]: { enabled: false },
    [EventType.MESSAGE_UPDATED]: { enabled: false },

    [EventType.FILE_EDITED]: { enabled: false },
    [EventType.FILE_WATCHER_UPDATED]: { enabled: false },

    [EventType.PERMISSION_ASKED]: { enabled: false },
    [EventType.PERMISSION_REPLIED]: { enabled: false },

    [EventType.COMMAND_EXECUTED]: { enabled: false },

    [EventType.LSP_CLIENT_DIAGNOSTICS]: { enabled: false },
    [EventType.LSP_UPDATED]: { enabled: false },

    [EventType.INSTALLATION_UPDATED]: { toast: true },

    [EventType.TODO_UPDATED]: { enabled: false },

    [EventType.SHELL_ENV]: { enabled: false },

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
      task: { logToAudit: true, runScripts: true, scripts: ['log-agent.sh'] },
    },
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: {},
      skill: { logToAudit: true, runScripts: true, scripts: ['log-skill.sh'] },
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
