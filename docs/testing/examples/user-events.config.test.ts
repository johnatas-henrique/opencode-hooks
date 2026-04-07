import { TOAST_DURATION } from '../../../.opencode/plugins/helpers/constants';
import { EventType } from '../../../.opencode/plugins/helpers/config';
import type { UserEventsConfig } from '../../../.opencode/plugins/helpers/config';

export const userConfig: UserEventsConfig = {
  enabled: true,

  default: {
    debug: true,
    toast: true,
    runScripts: false,
    runOnlyOnce: false,
    saveToFile: true,
    appendToSession: false,
  },

  events: {
    [EventType.SESSION_CREATED]: {
      toast: { variant: 'success' },
      runScripts: true,
      runOnlyOnce: false,
      appendToSession: true,
      scripts: ['session-created.sh'],
    },
    [EventType.SESSION_COMPACTED]: {
      toast: { duration: TOAST_DURATION.FIVE_SECONDS, variant: 'warning' },
    },
    [EventType.SESSION_DELETED]: { toast: { variant: 'error' } },
    [EventType.SESSION_ERROR]: { toast: { variant: 'error' } },
    [EventType.SESSION_IDLE]: { toast: true },
    [EventType.SESSION_STATUS]: { toast: true },
    [EventType.SESSION_UPDATED]: { toast: true },
    [EventType.SESSION_DIFF]: { toast: { variant: 'warning' } },

    [EventType.MESSAGE_PART_DELTA]: { toast: false },
    [EventType.MESSAGE_PART_REMOVED]: { toast: { variant: 'warning' } },
    [EventType.MESSAGE_PART_UPDATED]: { toast: true },
    [EventType.MESSAGE_REMOVED]: { toast: { variant: 'warning' } },
    [EventType.MESSAGE_UPDATED]: { toast: true },

    [EventType.FILE_EDITED]: { toast: true },
    [EventType.FILE_WATCHER_UPDATED]: { toast: true },

    [EventType.PERMISSION_ASKED]: { toast: { variant: 'warning' } },
    [EventType.PERMISSION_REPLIED]: { toast: { variant: 'warning' } },

    [EventType.SERVER_CONNECTED]: { toast: { variant: 'success' } },

    [EventType.SERVER_INSTANCE_DISPOSED]: { toast: { variant: 'info' } },

    [EventType.COMMAND_EXECUTED]: { toast: { variant: 'success' } },

    [EventType.LSP_CLIENT_DIAGNOSTICS]: { toast: { variant: 'warning' } },
    [EventType.LSP_UPDATED]: { toast: true },

    [EventType.INSTALLATION_UPDATED]: { toast: { variant: 'success' } },

    [EventType.TODO_UPDATED]: { toast: true },

    [EventType.SHELL_ENV]: { toast: true },

    [EventType.TUI_PROMPT_APPEND]: { toast: false },
    [EventType.TUI_COMMAND_EXECUTE]: { toast: true },
    [EventType.TUI_TOAST_SHOW]: { enabled: false },

    [EventType.EXPERIMENTAL_SESSION_COMPACTING]: {
      toast: { variant: 'warning' },
    },
  },

  tools: {
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: {
        enabled: true,
        toast: {
          enabled: true,
          title: '====TASK====',
          duration: TOAST_DURATION.FIVE_SECONDS,
        },
        runScripts: false,
      },
      skill: {
        enabled: true,
        toast: {
          enabled: true,
          title: '====SKILL====',
          duration: TOAST_DURATION.FIVE_SECONDS,
        },
        runScripts: false,
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
      task: {
        enabled: true,
        toast: {
          enabled: true,
          title: '====TASK====',
          duration: TOAST_DURATION.FIVE_SECONDS,
        },
        runScripts: false,
      },
      skill: {
        enabled: true,
        toast: {
          enabled: true,
          title: '====SKILL====',
          duration: TOAST_DURATION.FIVE_SECONDS,
        },
        runScripts: false,
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
  },
};
