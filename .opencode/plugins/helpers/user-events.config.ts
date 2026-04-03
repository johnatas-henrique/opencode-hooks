import { EventType } from './event-types';
import type { UserEventsConfig } from './event-types';

export const userConfig: UserEventsConfig = {
  enabled: true,
  toast: false,
  saveToFile: true,
  appendToSession: true,
  runScripts: true,

  events: {
    [EventType.SESSION_CREATED]: { toast: { duration: 5000 } },
    [EventType.SESSION_COMPACTED]: { scripts: ['pre-compact.sh'], toast: { duration: 5000, variant: 'warning' } },
    [EventType.SESSION_DELETED]: false,
    [EventType.SESSION_DIFF]: false,
    [EventType.SESSION_ERROR]: { toast: { duration: 30000 } },
    [EventType.SESSION_IDLE]: false,
    [EventType.SESSION_STATUS]: false,
    [EventType.SESSION_UPDATED]: false,

    [EventType.MESSAGE_PART_REMOVED]: false,
    [EventType.MESSAGE_PART_UPDATED]: false,
    [EventType.MESSAGE_REMOVED]: false,
    [EventType.MESSAGE_UPDATED]: false,

    [EventType.FILE_EDITED]: true,
    [EventType.FILE_WATCHER_UPDATED]: true,

    [EventType.PERMISSION_ASKED]: { toast: { duration: 5000, variant: 'info' } },
    [EventType.PERMISSION_REPLIED]: true,

    [EventType.SERVER_CONNECTED]: { toast: { duration: 10000 } },
    [EventType.SERVER_INSTANCE_DISPOSED]: { scripts: ['session-closed.sh'], toast: false },

    [EventType.COMMAND_EXECUTED]: true,

    [EventType.LSP_CLIENT_DIAGNOSTICS]: false,
    [EventType.LSP_UPDATED]: false,

    [EventType.INSTALLATION_UPDATED]: true,

    [EventType.TODO_UPDATED]: true,

    [EventType.SHELL_ENV]: { runScripts: false },

    [EventType.TUI_PROMPT_APPEND]: { toast: false },
    [EventType.TUI_COMMAND_EXECUTE]: true,
    [EventType.TUI_TOAST_SHOW]: { runScripts: false, toast: false },

    [EventType.EXPERIMENTAL_SESSION_COMPACTING]: true,
  },

  tools: {
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: { toast: { duration: 5000 }, scripts: ['log-agent.sh'] },
      chat: { toast: false },
      'git.commit': { runScripts: false },
    },
    [EventType.TOOL_EXECUTE_BEFORE]: {
      read: { toast: false },
      write: { toast: false },
    },
  },
};
