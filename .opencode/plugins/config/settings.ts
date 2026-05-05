import { DEFAULTS } from '.opencode/plugins/core/constants';
import { OpenCodeEvents } from '.opencode/plugins/types/core';
import type { UserEventsConfig } from '.opencode/plugins/types/config';

export const userConfig: UserEventsConfig = {
  enabled: true,

  logDisabledEvents: false,
  showPluginStatus: true,
  pluginStatusDisplayMode: 'user-only',

  loadClaudeHookSettings: {
    loadGlobalClaudeHooks: true,
    loadLocalClaudeHooks: true,
  },

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
    maxSizeMB: 1,
    maxAgeDays: 30,
    logTruncationKB: 2,
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
    files: DEFAULTS.audit.files,
  },

  events: {
    [OpenCodeEvents.SERVER_CONNECTED]: { enabled: false },
    [OpenCodeEvents.SERVER_INSTANCE_DISPOSED]: {
      runScripts: true,
      scripts: [
        { source: 'native', path: 'mempalace-exit.sh' },
        { source: 'native', path: 'session-stop.sh' },
      ],
    },

    [OpenCodeEvents.SESSION_CREATED]: {
      runScripts: true,
      runOnlyOnce: true,
      appendToSession: true,
      scripts: [
        { source: 'native', path: 'mempalace-wake.sh' },
        { source: 'native', path: 'session-created.sh' },
      ],
    },
    [OpenCodeEvents.SESSION_COMPACTED]: { toast: true },
    [OpenCodeEvents.SESSION_DELETED]: {
      toast: true,
      runScripts: true,
      scripts: [{ source: 'native', path: 'mempalace-exit.sh' }],
    },
    [OpenCodeEvents.SESSION_IDLE]: { toast: true },
    [OpenCodeEvents.SESSION_DIFF]: { enabled: false },
    [OpenCodeEvents.SESSION_ERROR]: { toast: true },
    [OpenCodeEvents.SESSION_STATUS]: { enabled: false },
    [OpenCodeEvents.SESSION_UPDATED]: { enabled: false },
    [OpenCodeEvents.SESSION_UNKNOWN]: { toast: true },

    [OpenCodeEvents.MESSAGE_PART_DELTA]: { enabled: false },
    [OpenCodeEvents.MESSAGE_PART_REMOVED]: { enabled: false },
    [OpenCodeEvents.MESSAGE_PART_UPDATED]: { enabled: false },
    [OpenCodeEvents.MESSAGE_REMOVED]: { enabled: false },
    [OpenCodeEvents.MESSAGE_UPDATED]: { enabled: false },

    [OpenCodeEvents.FILE_EDITED]: { enabled: false },
    [OpenCodeEvents.FILE_WATCHER_UPDATED]: { enabled: false },

    [OpenCodeEvents.PERMISSION_ASKED]: { enabled: false },
    [OpenCodeEvents.PERMISSION_REPLIED]: { enabled: false },

    [OpenCodeEvents.COMMAND_EXECUTED]: { enabled: false },

    [OpenCodeEvents.LSP_CLIENT_DIAGNOSTICS]: { enabled: false },
    [OpenCodeEvents.LSP_UPDATED]: { enabled: false },

    [OpenCodeEvents.INSTALLATION_UPDATED]: { toast: true },

    [OpenCodeEvents.TODO_UPDATED]: { enabled: false },

    [OpenCodeEvents.SHELL_ENV]: { enabled: false },

    [OpenCodeEvents.EXPERIMENTAL_SESSION_COMPACTING]: {
      toast: true,
      scripts: [{ source: 'native', path: 'mempalace-wake.sh' }],
    },

    [OpenCodeEvents.CHAT_MESSAGE]: {
      runScripts: true,
      scripts: [{ source: 'native', path: 'mempalace-mine.sh' }],
    },
    [OpenCodeEvents.CHAT_PARAMS]: { enabled: false },
    [OpenCodeEvents.CHAT_HEADERS]: { enabled: false },
    [OpenCodeEvents.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM]: { enabled: false },
    [OpenCodeEvents.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM]: { enabled: false },
    [OpenCodeEvents.EXPERIMENTAL_TEXT_COMPLETE]: { enabled: false },
    [OpenCodeEvents.TOOL_DEFINITION]: { enabled: false },

    [OpenCodeEvents.TUI_PROMPT_APPEND]: { enabled: false },
    [OpenCodeEvents.TUI_COMMAND_EXECUTE]: { enabled: false },

    [OpenCodeEvents.TUI_TOAST_SHOW]: { enabled: false },
  },

  tools: {
    [OpenCodeEvents.TOOL_EXECUTE_AFTER_SUBAGENT]: {
      task: {
        logToAudit: true,
        toast: true,
        runScripts: true,
        scripts: [{ source: 'native', path: 'log-agent.sh' }],
      },
    },
    [OpenCodeEvents.TOOL_EXECUTE_AFTER]: {
      task: {},
      skill: {
        logToAudit: true,
        toast: true,
        runScripts: true,
        scripts: [{ source: 'native', path: 'log-skill.sh' }],
      },
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
    [OpenCodeEvents.TOOL_EXECUTE_BEFORE]: {
      task: {},
      skill: {},
      bash: {},
      write: {},
      read: {},
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
