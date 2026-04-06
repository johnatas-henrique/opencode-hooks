import { TOAST_DURATION } from './constants';
import { EventType } from './event-types';
import type { UserEventsConfig } from './event-types';

export const userConfig: UserEventsConfig = {
  enabled: true,

  default: {
    debug: false,
    toast: false,
    runScripts: false,
    runOnlyOnce: false,
    saveToFile: true,
    appendToSession: false,
  },

  events: {
    [EventType.TOOL_EXECUTE_AFTER]: false,
    [EventType.TOOL_EXECUTE_BEFORE]: false,

    [EventType.SERVER_CONNECTED]: { toast: { variant: 'success' } },
    [EventType.SERVER_INSTANCE_DISPOSED]: { scripts: ['session-closed.sh'] },

    [EventType.SESSION_CREATED]: {
      toast: { variant: 'success' },
      runScripts: true,
      runOnlyOnce: true,
      appendToSession: true,
    },
    [EventType.SESSION_COMPACTED]: {
      toast: { duration: TOAST_DURATION.FIVE_SECONDS, variant: 'warning' },
      scripts: ['pre-compact.sh'],
      runScripts: true,
    },
    [EventType.SESSION_DELETED]: { enabled: false },
    [EventType.SESSION_DIFF]: { enabled: false },
    [EventType.SESSION_ERROR]: {},
    [EventType.SESSION_IDLE]: { enabled: false },
    [EventType.SESSION_STATUS]: { enabled: false },
    [EventType.SESSION_UPDATED]: { enabled: false },

    [EventType.MESSAGE_PART_DELTA]: { enabled: false },
    [EventType.MESSAGE_PART_REMOVED]: { enabled: false },
    [EventType.MESSAGE_PART_UPDATED]: { enabled: false },
    [EventType.MESSAGE_REMOVED]: { enabled: false },
    [EventType.MESSAGE_UPDATED]: { enabled: false },

    [EventType.FILE_EDITED]: { enabled: true },
    [EventType.FILE_WATCHER_UPDATED]: { enabled: true },

    [EventType.PERMISSION_ASKED]: { enabled: true },
    [EventType.PERMISSION_REPLIED]: { enabled: true },

    [EventType.COMMAND_EXECUTED]: { enabled: false },

    [EventType.LSP_CLIENT_DIAGNOSTICS]: { enabled: false },
    [EventType.LSP_UPDATED]: { enabled: false },

    [EventType.INSTALLATION_UPDATED]: { enabled: false },

    [EventType.TODO_UPDATED]: { enabled: false },

    [EventType.SHELL_ENV]: { enabled: false },

    [EventType.TUI_PROMPT_APPEND]: { toast: false },
    [EventType.TUI_COMMAND_EXECUTE]: { enabled: false },
    [EventType.TUI_TOAST_SHOW]: { runScripts: false, toast: false },

    [EventType.EXPERIMENTAL_SESSION_COMPACTING]: { runScripts: true },
  },

  tools: {
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: {
        toast: {
          title: '====SUBAGENT====',
          duration: TOAST_DURATION.FIVE_SECONDS,
        },
        scripts: ['log-agent.sh'],
        runScripts: true,
      },
      chat: { toast: { enabled: false, title: '====CHAT====' } },
      read: { toast: { enabled: false, title: '====FILE READ====' } },
      write: { toast: { enabled: false, title: '====FILE WRITE====' } },
      edit: { toast: { enabled: false, title: '====FILE EDIT====' } },
      glob: { toast: { enabled: false, title: '====FILE SEARCH====' } },
      grep: { toast: { enabled: false, title: '====TEXT SEARCH====' } },
      bash: { toast: { enabled: false, title: '====TERMINAL====' } },
      list: { toast: { enabled: false, title: '====DIRECTORY LIST====' } },
      patch: { toast: { enabled: false, title: '====PATCH====' } },
      webfetch: { toast: { enabled: false, title: '====WEB FETCH====' } },
      websearch: { toast: { enabled: false, title: '====WEB SEARCH====' } },
      codesearch: { toast: { enabled: false, title: '====CODE SEARCH====' } },
      skill: { toast: { enabled: false, title: '====SKILL====' } },
      todowrite: { toast: { enabled: false, title: '====TODO WRITE====' } },
      todoread: { toast: { enabled: false, title: '====TODO READ====' } },
      question: { toast: { enabled: false, title: '====QUESTION====' } },
      'git.commit': { toast: { enabled: false, title: '====GIT COMMIT====' } },
      'git.push': { toast: { enabled: false, title: '====GIT PUSH====' } },
      'git.pull': { toast: { enabled: false, title: '====GIT PULL====' } },
      filesystem_read_file: {
        toast: { enabled: false, title: '====FS READ====' },
      },
      filesystem_write_file: {
        toast: { enabled: false, title: '====FS WRITE====' },
      },
      filesystem_list_directory: {
        toast: { enabled: false, title: '====FS LIST====' },
      },
      filesystem_search_files: {
        toast: { enabled: false, title: '====FS SEARCH====' },
      },
      filesystem_create_directory: {
        toast: { enabled: false, title: '====FS MKDIR====' },
      },
      filesystem_move_file: {
        toast: { enabled: false, title: '====FS MOVE====' },
      },
      filesystem_get_file_info: {
        toast: { enabled: false, title: '====FS STAT====' },
      },
      gh_grep_searchGitHub: {
        toast: { enabled: false, title: '====GH SEARCH====' },
      },
    },
    [EventType.TOOL_EXECUTE_BEFORE]: {
      task: { toast: { enabled: false, title: '====SUBAGENT====' } },
      chat: { toast: { enabled: false, title: '====CHAT====' } },
      read: { toast: { enabled: false, title: '====FILE READ====' } },
      write: { toast: { enabled: false, title: '====FILE WRITE====' } },
      edit: { toast: { enabled: false, title: '====FILE EDIT====' } },
      glob: { toast: { enabled: false, title: '====FILE SEARCH====' } },
      grep: { toast: { enabled: false, title: '====TEXT SEARCH====' } },
      bash: { toast: { enabled: false, title: '====TERMINAL====' } },
      list: { toast: { enabled: false, title: '====DIRECTORY LIST====' } },
      patch: { toast: { enabled: false, title: '====PATCH====' } },
      webfetch: { toast: { enabled: false, title: '====WEB FETCH====' } },
      websearch: { toast: { enabled: false, title: '====WEB SEARCH====' } },
      codesearch: { toast: { enabled: false, title: '====CODE SEARCH====' } },
      skill: { toast: { enabled: false, title: '====SKILL====' } },
      todowrite: { toast: { enabled: false, title: '====TODO WRITE====' } },
      todoread: { toast: { enabled: false, title: '====TODO READ====' } },
      question: { toast: { enabled: false, title: '====QUESTION====' } },
      'git.commit': { toast: { enabled: false, title: '====GIT COMMIT====' } },
      'git.push': { toast: { enabled: false, title: '====GIT PUSH====' } },
      'git.pull': { toast: { enabled: false, title: '====GIT PULL====' } },
      filesystem_read_file: {
        toast: { enabled: false, title: '====FS READ====' },
      },
      filesystem_write_file: {
        toast: { enabled: false, title: '====FS WRITE====' },
      },
      filesystem_list_directory: {
        toast: { enabled: false, title: '====FS LIST====' },
      },
      filesystem_search_files: {
        toast: { enabled: false, title: '====FS SEARCH====' },
      },
      filesystem_create_directory: {
        toast: { enabled: false, title: '====FS MKDIR====' },
      },
      filesystem_move_file: {
        toast: { enabled: false, title: '====FS MOVE====' },
      },
      filesystem_get_file_info: {
        toast: { enabled: false, title: '====FS STAT====' },
      },
      gh_grep_searchGitHub: {
        toast: { enabled: false, title: '====GH SEARCH====' },
      },
    },
  },
};
