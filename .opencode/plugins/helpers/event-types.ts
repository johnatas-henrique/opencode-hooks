export enum EventType {
  SESSION_CREATED = 'session.created',
  SESSION_COMPACTED = 'session.compacted',
  SESSION_DELETED = 'session.deleted',
  SESSION_DIFF = 'session.diff',
  SESSION_ERROR = 'session.error',
  SESSION_IDLE = 'session.idle',
  SESSION_STATUS = 'session.status',
  SESSION_UPDATED = 'session.updated',

  MESSAGE_PART_REMOVED = 'message.part.removed',
  MESSAGE_PART_UPDATED = 'message.part.updated',
  MESSAGE_REMOVED = 'message.removed',
  MESSAGE_UPDATED = 'message.updated',

  TOOL_EXECUTE_BEFORE = 'tool.execute.before',
  TOOL_EXECUTE_AFTER = 'tool.execute.after',

  FILE_EDITED = 'file.edited',
  FILE_WATCHER_UPDATED = 'file.watcher.updated',

  PERMISSION_ASKED = 'permission.asked',
  PERMISSION_REPLIED = 'permission.replied',

  SERVER_CONNECTED = 'server.connected',
  SERVER_INSTANCE_DISPOSED = 'server.instance.disposed',

  COMMAND_EXECUTED = 'command.executed',

  LSP_CLIENT_DIAGNOSTICS = 'lsp.client.diagnostics',
  LSP_UPDATED = 'lsp.updated',

  INSTALLATION_UPDATED = 'installation.updated',

  TODO_UPDATED = 'todo.updated',

  SHELL_ENV = 'shell.env',

  TUI_PROMPT_APPEND = 'tui.prompt.append',
  TUI_COMMAND_EXECUTE = 'tui.command.execute',
  TUI_TOAST_SHOW = 'tui.toast.show',

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
  runOnce?: boolean;
}

export interface ToolOverride {
  toast?: boolean | ToastOverride;
  scripts?: string[];
  runScripts?: boolean;
  saveToFile?: boolean;
  appendToSession?: boolean;
  runOnce?: boolean;
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
  runOnce: boolean;
}
