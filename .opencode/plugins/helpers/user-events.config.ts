import { TOAST_DURATION } from './constants';
import { EventType } from './config';
import type { UserEventsConfig } from './config';

export const userConfig: UserEventsConfig = {
  enabled: true,

  pluginStatus: {
    enabled: true,
    displayMode: 'user-only',
  },

  default: {
    debug: false,
    toast: false,
    runScripts: false,
    runOnlyOnce: false,
    saveToFile: false,
    appendToSession: false,
  },

  events: {
    [EventType.TOOL_EXECUTE_AFTER]: false,
    [EventType.TOOL_EXECUTE_BEFORE]: false,

    [EventType.SERVER_CONNECTED]: { toast: { variant: 'success' } },
    [EventType.SERVER_INSTANCE_DISPOSED]: {
      enabled: true,
      scripts: ['session-closed.sh'],
      runScripts: true,
      saveToFile: true,
    },

    [EventType.SESSION_CREATED]: {
      enabled: true,
      toast: { variant: 'success' },
      runScripts: true,
      runOnlyOnce: true,
      saveToFile: true,
      appendToSession: true,
    },
    [EventType.SESSION_COMPACTED]: {
      enabled: true,
      toast: { variant: 'warning' },
      scripts: ['pre-compact.sh'],
      runScripts: true,
      saveToFile: true,
    },
    [EventType.SESSION_DELETED]: { enabled: false },
    [EventType.SESSION_DIFF]: { enabled: false },
    [EventType.SESSION_ERROR]: {
      enabled: true,
      toast: { duration: TOAST_DURATION.THIRTY_SECONDS, variant: 'error' },
    },
    [EventType.SESSION_IDLE]: { enabled: false },
    [EventType.SESSION_STATUS]: { enabled: false },
    [EventType.SESSION_UPDATED]: { enabled: false },

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

    [EventType.INSTALLATION_UPDATED]: { enabled: false },

    [EventType.TODO_UPDATED]: { enabled: false },

    [EventType.SHELL_ENV]: { enabled: false },

    [EventType.TUI_PROMPT_APPEND]: { toast: false },
    [EventType.TUI_COMMAND_EXECUTE]: { enabled: false },
    [EventType.TUI_TOAST_SHOW]: { enabled: false },

    [EventType.EXPERIMENTAL_SESSION_COMPACTING]: {
      enabled: true,
      toast: { variant: 'warning' },
      scripts: ['pre-compact.sh'],
      runScripts: true,
      saveToFile: true,
    },

    [EventType.CHAT_MESSAGE]: { enabled: false },
    [EventType.CHAT_PARAMS]: { enabled: false },
    [EventType.CHAT_HEADERS]: { enabled: false },
    [EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM]: { enabled: false },
    [EventType.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM]: { enabled: false },
    [EventType.EXPERIMENTAL_TEXT_COMPLETE]: { enabled: false },
    [EventType.SESSION_UNKNOWN]: { enabled: false },
  },

  tools: {
    [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: {
      task: {
        enabled: true,
        toast: {
          enabled: true,
          title: '====SUBAGENT====',
          duration: TOAST_DURATION.TEN_SECONDS,
          variant: 'success',
        },
        scripts: ['log-agent.sh'],
        runScripts: true,
        saveToFile: true,
      },
    },
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: {
        enabled: true,
        toast: { enabled: true, title: '====TOOL====' },
      },
      skill: {
        enabled: true,
        toast: {
          enabled: true,
          title: '====SKILL====',
          duration: TOAST_DURATION.TEN_SECONDS,
          variant: 'success',
        },
        scripts: ['log-skill.sh'],
        runScripts: true,
        saveToFile: true,
      },
      chat: { toast: { title: '====CHAT====' } },
      read: { toast: { title: '====FILE READ====' } },
      write: { toast: { title: '====FILE WRITE====' } },
      edit: { toast: { title: '====FILE EDIT====' } },
      glob: { toast: { title: '====FILE SEARCH====' } },
      grep: { toast: { title: '====TEXT SEARCH====' } },
      bash: { toast: { title: '====TERMINAL====' } },
      list: { toast: { title: '====DIRECTORY LIST====' } },
      patch: { toast: { title: '====PATCH====' } },
      webfetch: { toast: { title: '====WEB FETCH====' } },
      websearch: { toast: { title: '====WEB SEARCH====' } },
      codesearch: { toast: { title: '====CODE SEARCH====' } },
      todowrite: { toast: { title: '====TODO WRITE====' } },
      todoread: { toast: { title: '====TODO READ====' } },
      question: { toast: { title: '====QUESTION====' } },
      'git.commit': { toast: { title: '====GIT COMMIT====' } },
      'git.push': { toast: { title: '====GIT PUSH====' } },
      'git.pull': { toast: { title: '====GIT PULL====' } },
      filesystem_read_file: { toast: { title: '====FS READ====' } },
      filesystem_write_file: { toast: { title: '====FS WRITE====' } },
      filesystem_list_directory: { toast: { title: '====FS LIST====' } },
      filesystem_search_files: { toast: { title: '====FS SEARCH====' } },
      filesystem_create_directory: { toast: { title: '====FS MKDIR====' } },
      filesystem_move_file: { toast: { title: '====FS MOVE====' } },
      filesystem_get_file_info: { toast: { title: '====FS STAT====' } },
      gh_grep_searchGitHub: { toast: { title: '====GH SEARCH====' } },
    },
    [EventType.TOOL_EXECUTE_BEFORE]: {
      task: { toast: { title: '====TOOL====' } },
      skill: { toast: { title: '====SKILL====' } },
      chat: { toast: { title: '====CHAT====' } },
      read: { toast: { title: '====FILE READ====' } },
      write: { toast: { title: '====FILE WRITE====' } },
      edit: { toast: { title: '====FILE EDIT====' } },
      glob: { toast: { title: '====FILE SEARCH====' } },
      grep: { toast: { title: '====TEXT SEARCH====' } },
      bash: { toast: { title: '====TERMINAL====' } },
      list: { toast: { title: '====DIRECTORY LIST====' } },
      patch: { toast: { title: '====PATCH====' } },
      webfetch: { toast: { title: '====WEB FETCH====' } },
      websearch: { toast: { title: '====WEB SEARCH====' } },
      codesearch: { toast: { title: '====CODE SEARCH====' } },
      todowrite: { toast: { title: '====TODO WRITE====' } },
      todoread: { toast: { title: '====TODO READ====' } },
      question: { toast: { title: '====QUESTION====' } },
      'git.commit': { toast: { title: '====GIT COMMIT====' } },
      'git.push': { toast: { title: '====GIT PUSH====' } },
      'git.pull': { toast: { title: '====GIT PULL====' } },
      filesystem_read_file: { toast: { title: '====FS READ====' } },
      filesystem_write_file: { toast: { title: '====FS WRITE====' } },
      filesystem_list_directory: { toast: { title: '====FS LIST====' } },
      filesystem_search_files: { toast: { title: '====FS SEARCH====' } },
      filesystem_create_directory: { toast: { title: '====FS MKDIR====' } },
      filesystem_move_file: { toast: { title: '====FS MOVE====' } },
      filesystem_get_file_info: { toast: { title: '====FS STAT====' } },
      gh_grep_searchGitHub: { toast: { title: '====GH SEARCH====' } },
    },
  },
};
