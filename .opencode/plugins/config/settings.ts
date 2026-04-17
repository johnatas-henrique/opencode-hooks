import { TOAST_DURATION } from '../core/constants';
import { EventType } from '../types/config';
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
    [EventType.SESSION_IDLE]: { enabled: false },
    [EventType.SESSION_DIFF]: { enabled: false },
    [EventType.SESSION_ERROR]: { toast: true },
    [EventType.SESSION_STATUS]: { enabled: false },
    [EventType.SESSION_UPDATED]: { enabled: false },
    [EventType.SESSION_UNKNOWN]: { enabled: false },

    [EventType.MESSAGE_PART_DELTA]: { enabled: false },
    [EventType.MESSAGE_PART_REMOVED]: { enabled: false },
    [EventType.MESSAGE_PART_UPDATED]: { enabled: false },
    [EventType.MESSAGE_REMOVED]: { enabled: false },
    [EventType.MESSAGE_UPDATED]: { enabled: false },

    [EventType.FILE_EDITED]: { toast: true },
    [EventType.FILE_WATCHER_UPDATED]: { toast: true },

    [EventType.PERMISSION_ASKED]: { toast: true },
    [EventType.PERMISSION_REPLIED]: { toast: true },

    [EventType.COMMAND_EXECUTED]: { toast: true },

    [EventType.LSP_CLIENT_DIAGNOSTICS]: { toast: true },
    [EventType.LSP_UPDATED]: { toast: true },

    [EventType.INSTALLATION_UPDATED]: { toast: true },

    [EventType.TODO_UPDATED]: { toast: true },

    [EventType.SHELL_ENV]: { toast: true },

    [EventType.EXPERIMENTAL_SESSION_COMPACTING]: { toast: true },

    [EventType.CHAT_MESSAGE]: { enabled: false },
    [EventType.CHAT_PARAMS]: { enabled: false },
    [EventType.CHAT_HEADERS]: { enabled: false },
    [EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM]: { toast: true },
    [EventType.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM]: { toast: true },
    [EventType.EXPERIMENTAL_TEXT_COMPLETE]: { toast: true },
    [EventType.TOOL_DEFINITION]: { toast: true },

    [EventType.TUI_PROMPT_APPEND]: { toast: true },
    [EventType.TUI_COMMAND_EXECUTE]: { toast: true },

    [EventType.TUI_TOAST_SHOW]: { enabled: false },
  },

  tools: {
    [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: {
      task: {
        toast: true,
        saveToFile: true,
      },
    },
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: { toast: true },
      skill: { toast: true, saveToFile: true },
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
      task: { toast: true },
      skill: { toast: true },
      bash: {
        toast: true,
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
        toast: true,
        block: [
          { check: blockEnvFiles, message: '🚫 Cannot write .env files' },
        ],
      },
      read: {
        toast: true,
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
        toast: true,
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
