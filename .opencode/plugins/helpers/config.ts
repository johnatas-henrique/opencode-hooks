export enum EventType {
  SESSION_CREATED = 'session.created',
  SESSION_COMPACTED = 'session.compacted',
  SESSION_DELETED = 'session.deleted',
  SESSION_DIFF = 'session.diff',
  SESSION_ERROR = 'session.error',
  SESSION_IDLE = 'session.idle',
  SESSION_STATUS = 'session.status',
  SESSION_UPDATED = 'session.updated',

  MESSAGE_PART_DELTA = 'message.part.delta',
  MESSAGE_PART_REMOVED = 'message.part.removed',
  MESSAGE_PART_UPDATED = 'message.part.updated',
  MESSAGE_REMOVED = 'message.removed',
  MESSAGE_UPDATED = 'message.updated',

  TOOL_EXECUTE_BEFORE = 'tool.execute.before',
  TOOL_EXECUTE_AFTER = 'tool.execute.after',
  TOOL_EXECUTE_AFTER_SUBAGENT = 'tool.execute.after.subagent',

  FILE_EDITED = 'file.edited',
  FILE_WATCHER_UPDATED = 'file.watcher.updated',

  PERMISSION_ASKED = 'permission.asked',
  PERMISSION_REPLIED = 'permission.replied',
  PERMISSION_ASK = 'permission.ask',

  SERVER_CONNECTED = 'server.connected',
  SERVER_INSTANCE_DISPOSED = 'server.instance.disposed',

  COMMAND_EXECUTED = 'command.executed',
  COMMAND_EXECUTE_BEFORE = 'command.execute.before',

  LSP_CLIENT_DIAGNOSTICS = 'lsp.client.diagnostics',
  LSP_UPDATED = 'lsp.updated',

  INSTALLATION_UPDATED = 'installation.updated',

  TODO_UPDATED = 'todo.updated',

  SHELL_ENV = 'shell.env',

  TUI_PROMPT_APPEND = 'tui.prompt.append',
  TUI_COMMAND_EXECUTE = 'tui.command.execute',
  TUI_TOAST_SHOW = 'tui.toast.show',

  EXPERIMENTAL_SESSION_COMPACTING = 'experimental.session.compacting',

  CHAT_MESSAGE = 'chat.message',
  CHAT_PARAMS = 'chat.params',
  CHAT_HEADERS = 'chat.headers',
  EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM = 'experimental.chat.messages.transform',
  EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM = 'experimental.chat.system.transform',
  EXPERIMENTAL_TEXT_COMPLETE = 'experimental.text.complete',
  TOOL_DEFINITION = 'tool.definition',
  SESSION_UNKNOWN = 'session.unknown',
}

export type EventVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastOverride {
  enabled?: boolean;
  title?: string;
  message?: string;
  variant?: EventVariant;
  duration?: number;
}

export interface EventOverride {
  enabled?: boolean;
  debug?: boolean;
  toast?: boolean | ToastOverride;
  scripts?: string[];
  runScripts?: boolean;
  runOnlyOnce?: boolean;
  saveToFile?: boolean;
  appendToSession?: boolean;
}

export interface ToolOverride {
  enabled?: boolean;
  debug?: boolean;
  toast?: boolean | ToastOverride;
  scripts?: string[];
  runScripts?: boolean;
  runOnlyOnce?: boolean;
  saveToFile?: boolean;
  appendToSession?: boolean;
}

export type EventConfig = boolean | EventOverride;
export type ToolConfig = boolean | ToolOverride;

export type PluginStatusDisplayMode =
  | 'user-only'
  | 'user-separated'
  | 'all-labeled';

export interface UserEventsConfig {
  enabled: boolean;
  logDisabledEvents: boolean;
  showPluginStatus: boolean;
  pluginStatusDisplayMode: PluginStatusDisplayMode;
  default: EventOverride;
  events: Partial<Record<EventType, EventConfig>>;
  tools: {
    [EventType.TOOL_EXECUTE_AFTER]: Record<string, ToolConfig>;
    [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: Record<string, ToolConfig>;
    [EventType.TOOL_EXECUTE_BEFORE]: Record<string, ToolOverride>;
  };
}

export interface ResolvedEventConfig {
  enabled: boolean;
  debug: boolean;
  toast: boolean;
  toastTitle: string;
  toastMessage: string;
  toastVariant: EventVariant;
  toastDuration: number;
  scripts: string[];
  runScripts: boolean;
  saveToFile: boolean;
  appendToSession: boolean;
  runOnlyOnce: boolean;
}
