import { TOAST_DURATION } from './constants';
import { EventType } from './event-types';
import type { UserEventsConfig } from './event-types';

export const userConfig: UserEventsConfig = {
  enabled: true,

  default: {
    debug: false,
    toast: true,
    runScripts: false,
    runOnlyOnce: false,
    saveToFile: true,
    appendToSession: true,
  },

  events: {
    [EventType.TOOL_EXECUTE_AFTER]: { runScripts: false, toast: false },
    [EventType.TOOL_EXECUTE_BEFORE]: { runScripts: false, toast: false },

    [EventType.SERVER_CONNECTED]: { toast: { variant: 'success' } },
    [EventType.SERVER_INSTANCE_DISPOSED]: {
      scripts: ['session-closed.sh'],
      toast: false,
    },
    [EventType.SESSION_CREATED]: {
      runScripts: true,
      runOnlyOnce: true,
      toast: { variant: 'success' },
    },
    [EventType.SESSION_COMPACTED]: {
      scripts: ['pre-compact.sh'],
      runScripts: true,
      toast: { duration: TOAST_DURATION.FIVE_SECONDS, variant: 'warning' },
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
      skill: { toast: { title: '====SKILL====' } },
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
      task: { toast: { title: '====SUBAGENT====' } },
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
      skill: { toast: { title: '====SKILL====' } },
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
