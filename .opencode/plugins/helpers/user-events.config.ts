import { TOAST_DURATION } from './constants';
import { EventType } from './config';
import type { UserEventsConfig, ScriptResult } from './config';
import {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../types/opencode-hooks';

// ============================================
// BLOCK PREDICATES
// ============================================

type BlockPredicate = (
  input: ToolExecuteBeforeInput,
  output: ToolExecuteBeforeOutput,
  scriptResults: ScriptResult[]
) => boolean;

const blockEnvFiles: BlockPredicate = (_, output) =>
  (output.args.filePath as string)?.includes('.env');

const blockGitForce: BlockPredicate = (_, output) => {
  const cmd = output.args.command as string;
  return cmd?.includes('--force') || cmd?.includes(' -f');
};

const blockScriptsFailed: BlockPredicate = (_, __, results) =>
  results.some((r) => r.exitCode !== 0);

const blockByPath =
  (patterns: string[]): BlockPredicate =>
  (_, output) =>
    patterns.some((p) => (output.args.filePath as string)?.includes(p));

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

  events: {
    [EventType.SERVER_CONNECTED]: { enabled: false },
    [EventType.SERVER_INSTANCE_DISPOSED]: { enabled: false },

    [EventType.SESSION_CREATED]: {
      toast: true,
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

    // // Always disabled, because it fires on toast showing, so it can fires indefinitely
    [EventType.TUI_TOAST_SHOW]: { enabled: false },
  },

  tools: {
    [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: {
      task: {
        toast: true,
        scripts: ['log-agent.sh'],
        runScripts: true,
        saveToFile: true,
      },
    },
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: { toast: true },
      skill: {
        toast: true,
        scripts: ['log-skill.sh'],
        runScripts: true,
        saveToFile: true,
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
    [EventType.TOOL_EXECUTE_BEFORE]: {
      task: { toast: true },
      skill: { toast: true },
      bash: {
        toast: true,
        block: [
          { check: blockGitForce, message: '🚫 git --force forbidden' },
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
