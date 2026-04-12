import { TOAST_DURATION } from './constants';
import { EventType } from './config';
import type { UserEventsConfig } from './config';

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
    outputTitle: 'Script Output',
    errorTitle: 'Script Error',
  },

  default: {
    debug: false,
    toast: false,
    runScripts: false,
    runOnlyOnce: false,
    saveToFile: true,
    appendToSession: false,
  },

  events: {
    [EventType.SERVER_CONNECTED]: {},
    [EventType.SERVER_INSTANCE_DISPOSED]: {
      enabled: true,
      scripts: ['session-closed.sh'],
      // runScripts: true,
    },

    [EventType.SESSION_CREATED]: {
      enabled: true,
      runScripts: true,
      runOnlyOnce: true,
      appendToSession: true,
    },
    [EventType.SESSION_COMPACTED]: {
      enabled: false,
      scripts: ['pre-compact.sh'],
      // runScripts: true,
    },
    [EventType.SESSION_DELETED]: {
      enabled: false,
      runScripts: true,
    },
    [EventType.SESSION_IDLE]: {},
    [EventType.SESSION_DIFF]: { enabled: false },
    [EventType.SESSION_ERROR]: {
      enabled: true,
      toast: { duration: TOAST_DURATION.THIRTY_SECONDS, variant: 'error' },
    },
    [EventType.SESSION_STATUS]: { enabled: false },
    [EventType.SESSION_UPDATED]: { enabled: false },
    [EventType.SESSION_UNKNOWN]: { enabled: false },

    [EventType.MESSAGE_PART_DELTA]: { enabled: false },
    [EventType.MESSAGE_PART_REMOVED]: { enabled: false },
    [EventType.MESSAGE_PART_UPDATED]: { enabled: false },
    [EventType.MESSAGE_REMOVED]: { enabled: false },
    [EventType.MESSAGE_UPDATED]: { enabled: false },

    [EventType.FILE_EDITED]: {
      enabled: false,
      scripts: ['file-edit-console-warn.sh', 'file-edit-config-protection.sh'],
      // runScripts: true,
    },
    [EventType.FILE_WATCHER_UPDATED]: { enabled: false },

    [EventType.PERMISSION_ASKED]: { enabled: false },
    [EventType.PERMISSION_REPLIED]: { enabled: false },

    [EventType.COMMAND_EXECUTED]: { enabled: false },

    [EventType.LSP_CLIENT_DIAGNOSTICS]: { enabled: false },
    [EventType.LSP_UPDATED]: { enabled: false },

    [EventType.INSTALLATION_UPDATED]: { enabled: false },

    [EventType.TODO_UPDATED]: { enabled: false },

    [EventType.SHELL_ENV]: { enabled: false },

    [EventType.EXPERIMENTAL_SESSION_COMPACTING]: {
      enabled: false,
      toast: { variant: 'warning' },
      scripts: [
        'experimental-session-compacting-pre-compact.sh',
        'pre-compact.sh',
      ],
      // runScripts: true,
      saveToFile: true,
    },

    [EventType.CHAT_MESSAGE]: { enabled: false },
    [EventType.CHAT_PARAMS]: { enabled: false },
    [EventType.CHAT_HEADERS]: { enabled: false },
    [EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM]: { enabled: false },
    [EventType.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM]: { enabled: false },
    [EventType.EXPERIMENTAL_TEXT_COMPLETE]: { enabled: false },
    [EventType.TOOL_DEFINITION]: { enabled: false },

    [EventType.TUI_PROMPT_APPEND]: { toast: true },
    [EventType.TUI_COMMAND_EXECUTE]: { enabled: false },

    // // Always disabled, because it fires on toast showing, so it can fires indefinitely
    [EventType.TUI_TOAST_SHOW]: { enabled: false },
  },

  tools: {
    [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: {
      task: {
        enabled: true,
        toast: {
          enabled: true,
          duration: TOAST_DURATION.TEN_SECONDS,
        },
        scripts: ['log-agent.sh'],
        // runScripts: true,
        saveToFile: true,
      },
    },
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: { enabled: true },
      skill: {
        enabled: true,
        toast: true,
        scripts: ['log-skill.sh'],
        // runScripts: true,
        saveToFile: true,
      },
      bash: {
        enabled: true,
        toast: { enabled: true },
        scripts: [
          'tool-execute-after-bash-audit.sh',
          'tool-execute-after-build-complete.sh',
          'tool-execute-after-governance-capture.sh',
          'tool-execute-after-pr-created.sh',
          'reload-config.sh',
        ],
        runScripts: true,
      },
      write: {
        enabled: true,
        toast: { enabled: true },
        scripts: [
          'tool-execute-after-quality-gate.sh',
          'file-edit-accumulator.sh',
        ],
        runScripts: true,
      },
      edit: {
        enabled: false,
        scripts: [
          'file-edit-console-warn.sh',
          'file-edit-design-quality.sh',
          'file-edit-accumulator.sh',
        ],
        runScripts: true,
      },
      chat: { enabled: true },
      read: { enabled: true },
      glob: { enabled: true },
      grep: { enabled: true },
      list: { enabled: true },
      patch: { enabled: true },
      webfetch: { enabled: true },
      websearch: { enabled: true },
      codesearch: { enabled: true },
      todowrite: { enabled: true },
      todoread: { enabled: true },
      question: { enabled: true },
      'git.commit': { enabled: true },
      'git.push': { enabled: true },
      'git.pull': { enabled: true },
      filesystem_read_file: { enabled: true },
      filesystem_write_file: { enabled: true },
      filesystem_list_directory: { enabled: true },
      filesystem_search_files: { enabled: true },
      filesystem_create_directory: { enabled: true },
      filesystem_move_file: { enabled: true },
      filesystem_get_file_info: { enabled: true },
      gh_grep_searchGitHub: { enabled: true },
    },
    [EventType.TOOL_EXECUTE_BEFORE]: {
      task: {},
      skill: {},
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
  },
};
