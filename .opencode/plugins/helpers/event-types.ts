export enum EventType {
  // Session Events (8)
  SESSION_CREATED = 'session.created',
  SESSION_COMPACTED = 'session.compacted',
  SESSION_DELETED = 'session.deleted',
  SESSION_DIFF = 'session.diff',
  SESSION_ERROR = 'session.error',
  SESSION_IDLE = 'session.idle',
  SESSION_STATUS = 'session.status',
  SESSION_UPDATED = 'session.updated',

  // Message Events (4)
  MESSAGE_PART_REMOVED = 'message.part.removed',
  MESSAGE_PART_UPDATED = 'message.part.updated',
  MESSAGE_REMOVED = 'message.removed',
  MESSAGE_UPDATED = 'message.updated',

  // Tool Events (2)
  TOOL_EXECUTE_BEFORE = 'tool.execute.before',
  TOOL_EXECUTE_AFTER = 'tool.execute.after',

  // File Events (2)
  FILE_EDITED = 'file.edited',
  FILE_WATCHER_UPDATED = 'file.watcher.updated',

  // Permission Events (2)
  PERMISSION_ASKED = 'permission.asked',
  PERMISSION_REPLIED = 'permission.replied',

  // Server Events (2)
  SERVER_CONNECTED = 'server.connected',
  SERVER_INSTANCE_DISPOSED = 'server.instance.disposed',

  // Command Events (1)
  COMMAND_EXECUTED = 'command.executed',

  // LSP Events (2)
  LSP_CLIENT_DIAGNOSTICS = 'lsp.client.diagnostics',
  LSP_UPDATED = 'lsp.updated',

  // Installation Events (1)
  INSTALLATION_UPDATED = 'installation.updated',

  // Todo Events (1)
  TODO_UPDATED = 'todo.updated',

  // Shell Events (1)
  SHELL_ENV = 'shell.env',

  // TUI Events (3)
  TUI_PROMPT_APPEND = 'tui.prompt.append',
  TUI_COMMAND_EXECUTE = 'tui.command.execute',
  TUI_TOAST_SHOW = 'tui.toast.show',

  // Experimental Events (1)
  EXPERIMENTAL_SESSION_COMPACTING = 'experimental.session.compacting',
}

export type EventVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastOverride {
  title?: string;
  message?: string;
  variant?: EventVariant;
  duration?: number;
}

export interface EventOverride {
  toast?: boolean | ToastOverride;
  scripts?: string[];
  runScripts?: boolean;
  saveToFile?: boolean;
  appendToSession?: boolean;
}

export interface ToolOverride {
  toast?: boolean | ToastOverride;
  scripts?: string[];
  runScripts?: boolean;
  saveToFile?: boolean;
  appendToSession?: boolean;
}

export type EventConfig = boolean | EventOverride;
export type ToolConfig = boolean | ToolOverride;

export interface UserEventsConfig {
  enabled: boolean;
  toast: boolean;
  saveToFile: boolean;
  appendToSession: boolean;
  runScripts: boolean;
  events: Partial<Record<EventType, EventConfig>>;
  tools: {
    [EventType.TOOL_EXECUTE_AFTER]?: Record<string, ToolConfig>;
    [EventType.TOOL_EXECUTE_BEFORE]?: Record<string, ToolOverride>;
  };
}

export interface ResolvedEventConfig {
  enabled: boolean;
  toast: boolean;
  toastTitle: string;
  toastMessage?: string;
  toastVariant: EventVariant;
  toastDuration: number;
  scripts: string[];
  saveToFile: boolean;
  appendToSession: boolean;
}
