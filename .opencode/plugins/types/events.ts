type BuildMessageFn = (
  event: Record<string, unknown>,
  allowedFields?: string[]
) => string;

export interface EventHandler {
  title: string;
  variant: 'success' | 'warning' | 'error' | 'info';
  duration: number;
  defaultScript: string;
  buildMessage: BuildMessageFn;
  allowedFields?: string[];
  defaultTemplate?: string;
}

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

import type {
  EventOverride,
  ScriptToastsConfig,
  EventConfig,
  ToolConfig,
} from './config';

export type { EventOverride, ScriptToastsConfig, EventConfig, ToolConfig };

export interface ConfigResolverContext {
  readonly enabled: boolean;
  readonly default: EventOverride;
  readonly scriptToasts: ScriptToastsConfig;
  readonly handlers: Record<string, EventHandler>;
  readonly getEventConfig: (eventType: string) => EventConfig | undefined;
  readonly getToolConfigs: (
    toolEventType: string
  ) => Record<string, ToolConfig> | undefined;
}

export interface ResolverFactory {
  createEventResolver(context: ConfigResolverContext): EventConfigResolver;
  createToolResolver(context: ConfigResolverContext): ToolConfigResolver;
}

export interface EventConfigResolver {
  resolve(
    eventType: string,
    input?: Record<string, unknown>,
    output?: Record<string, unknown>
  ): import('./config').ResolvedEventConfig;
}

export interface ToolConfigResolver {
  resolve(
    toolEventType: string,
    toolName: string,
    input?: Record<string, unknown>,
    output?: Record<string, unknown>
  ): import('./config').ResolvedEventConfig;
}

export interface BooleanFieldOptions {
  readonly key: keyof EventOverride | 'toast';
  readonly fallback: boolean;
}

export interface ResolvedToast {
  readonly enabled: boolean;
  readonly title?: string;
  readonly message?: string;
  readonly variant?: string;
  readonly duration?: number;
}

export interface ResolvedScripts {
  readonly scripts: string[];
  readonly runScripts: boolean;
}

export interface ResolvedSaveToFile {
  readonly enabled: boolean;
  readonly template?: string;
  readonly path?: string;
}
