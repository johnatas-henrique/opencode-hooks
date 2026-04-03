import { EventType } from './event-types';
import type { UserEventsConfig } from './event-types';

export const userConfig: UserEventsConfig = {
  enabled: true,
  toast: true,
  saveToFile: true,
  appendToSession: true,
  runScripts: true,

  events: {
    [EventType.SESSION_CREATED]: true,
    [EventType.SESSION_COMPACTED]: { scripts: ['pre-compact.sh'] },
    [EventType.SESSION_DELETED]: true,
    [EventType.SESSION_DIFF]: false,
    [EventType.SESSION_ERROR]: { toast: { duration: 30000 } },
    [EventType.SESSION_IDLE]: false,
    [EventType.SESSION_STATUS]: { toast: false },
    [EventType.SESSION_UPDATED]: { toast: false },

    [EventType.MESSAGE_PART_REMOVED]: true,
    [EventType.MESSAGE_PART_UPDATED]: true,
    [EventType.MESSAGE_REMOVED]: true,
    [EventType.MESSAGE_UPDATED]: true,

    [EventType.TOOL_EXECUTE_BEFORE]: true,
    [EventType.TOOL_EXECUTE_AFTER]: true,

    [EventType.FILE_EDITED]: true,
    [EventType.FILE_WATCHER_UPDATED]: true,

    [EventType.PERMISSION_ASKED]: { toast: { duration: 5000 } },
    [EventType.PERMISSION_REPLIED]: true,

    [EventType.SERVER_CONNECTED]: true,
    [EventType.SERVER_INSTANCE_DISPOSED]: {
      scripts: ['session-stop.sh'],
      toast: false,
    },

    [EventType.COMMAND_EXECUTED]: true,

    [EventType.LSP_CLIENT_DIAGNOSTICS]: { toast: false },
    [EventType.LSP_UPDATED]: true,

    [EventType.INSTALLATION_UPDATED]: true,

    [EventType.TODO_UPDATED]: true,

    [EventType.SHELL_ENV]: { runScripts: false },

    [EventType.TUI_PROMPT_APPEND]: { toast: false },
    [EventType.TUI_COMMAND_EXECUTE]: true,
    [EventType.TUI_TOAST_SHOW]: { toast: false },

    [EventType.EXPERIMENTAL_SESSION_COMPACTING]: true,
  },

  tools: {
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: { toast: true, scripts: ['log-agent.sh'] },
      chat: { toast: false },
      'git.commit': { runScripts: false },
    },
    [EventType.TOOL_EXECUTE_BEFORE]: {
      read: { toast: false },
      write: { toast: true },
    },
  },
};
