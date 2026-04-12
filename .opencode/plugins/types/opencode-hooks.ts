import type { Event, Message, Part } from '@opencode-ai/sdk';

export const OpenCodeEvents = {
  COMMAND_EXECUTED: 'command.executed',

  FILE_EDITED: 'file.edited',
  FILE_WATCHER_UPDATED: 'file.watcher.updated',
  VCS_BRANCH_UPDATED: 'vcs.branch.updated',

  INSTALLATION_UPDATED: 'installation.updated',
  INSTALLATION_UPDATE_AVAILABLE: 'installation.update-available',

  LSP_CLIENT_DIAGNOSTICS: 'lsp.client.diagnostics',
  LSP_UPDATED: 'lsp.updated',

  MESSAGE_PART_REMOVED: 'message.part.removed',
  MESSAGE_PART_UPDATED: 'message.part.updated',
  MESSAGE_REMOVED: 'message.removed',
  MESSAGE_UPDATED: 'message.updated',

  PERMISSION_UPDATED: 'permission.updated',
  PERMISSION_REPLIED: 'permission.replied',

  SERVER_CONNECTED: 'server.connected',
  SERVER_INSTANCE_DISPOSED: 'server.instance.disposed',

  SESSION_CREATED: 'session.created',
  SESSION_COMPACTED: 'session.compacted',
  SESSION_DELETED: 'session.deleted',
  SESSION_DIFF: 'session.diff',
  SESSION_ERROR: 'session.error',
  SESSION_IDLE: 'session.idle',
  SESSION_STATUS: 'session.status',
  SESSION_UPDATED: 'session.updated',

  TODO_UPDATED: 'todo.updated',

  SHELL_ENV: 'shell.env',

  TOOL_EXECUTE_AFTER: 'tool.execute.after',
  TOOL_EXECUTE_AFTER_SUBAGENT: 'tool.execute.after.subagent',
  TOOL_EXECUTE_BEFORE: 'tool.execute.before',

  TUI_PROMPT_APPEND: 'tui.prompt.append',
  TUI_COMMAND_EXECUTE: 'tui.command.execute',
  TUI_TOAST_SHOW: 'tui.toast.show',

  PTY_CREATED: 'pty.created',
  PTY_UPDATED: 'pty.updated',
  PTY_EXITED: 'pty.exited',
  PTY_DELETED: 'pty.deleted',
} as const;

export type OpenCodeEventType =
  (typeof OpenCodeEvents)[keyof typeof OpenCodeEvents];

export type OpenCodeEventMap = {
  [OpenCodeEvents.COMMAND_EXECUTED]: Event & { type: 'command.executed' };
  [OpenCodeEvents.FILE_EDITED]: Event & { type: 'file.edited' };
  [OpenCodeEvents.FILE_WATCHER_UPDATED]: Event & {
    type: 'file.watcher.updated';
  };
  [OpenCodeEvents.VCS_BRANCH_UPDATED]: Event & { type: 'vcs.branch.updated' };
  [OpenCodeEvents.INSTALLATION_UPDATED]: Event & {
    type: 'installation.updated';
  };
  [OpenCodeEvents.INSTALLATION_UPDATE_AVAILABLE]: Event & {
    type: 'installation.update-available';
  };
  [OpenCodeEvents.LSP_CLIENT_DIAGNOSTICS]: Event & {
    type: 'lsp.client.diagnostics';
  };
  [OpenCodeEvents.LSP_UPDATED]: Event & { type: 'lsp.updated' };
  [OpenCodeEvents.MESSAGE_PART_REMOVED]: Event & {
    type: 'message.part.removed';
  };
  [OpenCodeEvents.MESSAGE_PART_UPDATED]: Event & {
    type: 'message.part.updated';
  };
  [OpenCodeEvents.MESSAGE_REMOVED]: Event & { type: 'message.removed' };
  [OpenCodeEvents.MESSAGE_UPDATED]: Event & { type: 'message.updated' };
  [OpenCodeEvents.PERMISSION_UPDATED]: Event & { type: 'permission.updated' };
  [OpenCodeEvents.PERMISSION_REPLIED]: Event & { type: 'permission.replied' };
  [OpenCodeEvents.SERVER_CONNECTED]: Event & { type: 'server.connected' };
  [OpenCodeEvents.SERVER_INSTANCE_DISPOSED]: Event & {
    type: 'server.instance.disposed';
  };
  [OpenCodeEvents.SESSION_CREATED]: Event & { type: 'session.created' };
  [OpenCodeEvents.SESSION_COMPACTED]: Event & { type: 'session.compacted' };
  [OpenCodeEvents.SESSION_DELETED]: Event & { type: 'session.deleted' };
  [OpenCodeEvents.SESSION_DIFF]: Event & { type: 'session.diff' };
  [OpenCodeEvents.SESSION_ERROR]: Event & { type: 'session.error' };
  [OpenCodeEvents.SESSION_IDLE]: Event & { type: 'session.idle' };
  [OpenCodeEvents.SESSION_STATUS]: Event & { type: 'session.status' };
  [OpenCodeEvents.SESSION_UPDATED]: Event & { type: 'session.updated' };
  [OpenCodeEvents.TODO_UPDATED]: Event & { type: 'todo.updated' };
  [OpenCodeEvents.SHELL_ENV]: Event & { type: 'shell.env' };
  [OpenCodeEvents.TOOL_EXECUTE_AFTER]: Event & { type: 'tool.execute.after' };
  [OpenCodeEvents.TOOL_EXECUTE_AFTER_SUBAGENT]: Event & {
    type: 'tool.execute.after.subagent';
  };
  [OpenCodeEvents.TOOL_EXECUTE_BEFORE]: Event & { type: 'tool.execute.before' };
  [OpenCodeEvents.TUI_PROMPT_APPEND]: Event & { type: 'tui.prompt.append' };
  [OpenCodeEvents.TUI_COMMAND_EXECUTE]: Event & { type: 'tui.command.execute' };
  [OpenCodeEvents.TUI_TOAST_SHOW]: Event & { type: 'tui.toast.show' };
  [OpenCodeEvents.PTY_CREATED]: Event & { type: 'pty.created' };
  [OpenCodeEvents.PTY_UPDATED]: Event & { type: 'pty.updated' };
  [OpenCodeEvents.PTY_EXITED]: Event & { type: 'pty.exited' };
  [OpenCodeEvents.PTY_DELETED]: Event & { type: 'pty.deleted' };
};

export type OpenCodeEventProperties<T extends OpenCodeEventType> =
  OpenCodeEventMap[T]['properties'];

export type OpenCodeEventHandler<T extends OpenCodeEventType> = (input: {
  event: OpenCodeEventMap[T];
}) => Promise<void>;

export function createEventHandler<T extends OpenCodeEventType>(
  handler: OpenCodeEventHandler<T>
): OpenCodeEventHandler<T> {
  return handler;
}

export type ToolExecuteAfterInput = {
  tool: string;
  sessionID: string;
  callID: string;
  args: Record<string, unknown>;
};

export type ToolExecuteAfterOutput = {
  title: string;
  output: string;
  metadata: Record<string, unknown>;
  attachments?: Array<{
    type: 'file';
    mime: string;
    url: string;
    filename?: string;
    sessionID?: string;
    messageID?: string;
  }>;
  content?: Part[];
};

export type ToolExecuteBeforeInput = {
  tool: string;
  sessionID: string;
  callID: string;
};

export type ToolExecuteBeforeOutput = {
  args: Record<string, unknown>;
};

// ============================================
// Event Property Types
// ============================================

// Session Events Properties
export interface SessionCreatedProps {
  info: {
    id: string;
    title: string;
    parentID?: string;
  };
  sessionID?: string;
}

export interface SessionErrorProps {
  sessionID: string;
  error?: {
    name?: string;
    data?: { message?: string };
  };
}

export interface SessionCompactProps {
  sessionID: string;
}

export interface SessionDeleteProps {
  info: { id: string };
}

export interface SessionDiffProps {
  sessionID: string;
}

export interface SessionIdleProps {
  sessionID: string;
}

export interface SessionStatusProps {
  sessionID: string;
}

export interface SessionUpdateProps {
  sessionID: string;
}

// Server Events Properties
export interface ServerInstanceDisposedProps {
  directory: string;
  sessionID?: string;
}

// Tool Events Properties
export interface ToolExecuteAfterProps {
  tool: string;
  sessionID: string;
  callID: string;
  args: Record<string, unknown>;
  subagentType?: string;
}

export interface ToolExecuteBeforeProps {
  tool: string;
  sessionID: string;
  callID?: string;
  args?: Record<string, unknown>;
}

// Chat Events Properties
export interface ChatMessageProps {
  sessionID: string;
  agent?: string;
  model?: { providerID: string; modelID: string };
  messageID?: string;
  variant?: string;
  message?: { role: string; content: string };
}

export interface ChatParamsProps {
  sessionID: string;
  agent: string;
  model: { providerID: string; modelID: string };
  provider: { providerID: string; name: string };
  message: { role: string; content: string };
}

export interface ChatHeadersProps {
  sessionID: string;
  agent: string;
  model: { providerID: string; modelID: string };
  provider: { providerID: string; name: string };
  message: { role: string; content: string };
}

// Permission Events Properties
export interface PermissionAskProps {
  sessionID?: string;
  tool?: string;
  id?: string;
  type?: string;
  pattern?: string | string[];
  messageID?: string;
  callID?: string;
  title?: string;
}

// Shell Events Properties
export interface ShellEnvProps {
  cwd: string;
  sessionID?: string;
  callID?: string;
}

// Command Execute Events Properties
export interface CommandExecuteBeforeProps {
  command: string;
  sessionID: string;
  arguments: string;
}

// Tool Definition Properties
export interface ToolDefinitionProps {
  toolID: string;
}

// Experimental Events Properties
export interface ExperimentalChatMessagesTransformProps {
  sessionID?: string;
  messages: Message[];
}

export interface ExperimentalChatSystemTransformProps {
  sessionID?: string;
  model: { providerID: string; modelID: string };
}

export interface ExperimentalSessionCompactingProps {
  sessionID: string;
}

export interface ExperimentalTextCompleteProps {
  sessionID: string;
  messageID: string;
  partID: string;
}

// Event Input/Output Types for Hooks
export interface EventInputRecord {
  sessionID?: string;
  [key: string]: unknown;
}

export interface ChatMessageOutput {
  message: Record<string, unknown>;
  parts: Part[];
}

export interface ChatHeadersOutput {
  headers: Record<string, string>;
}

export interface ChatParamsOutput {
  temperature: number;
  topP: number;
  topK: number;
  options: Record<string, unknown>;
}

export interface CommandOutput {
  parts: Part[];
}

export interface ShellEnvOutput {
  env: Record<string, string>;
}

export interface ToolDefinitionOutput {
  description: string;
  parameters: Record<string, unknown>;
}

export interface ExperimentalMessagesTransformOutput {
  messages: Message[];
}

export interface ExperimentalSystemTransformOutput {
  system: string[];
}

export interface ExperimentalCompactingOutput {
  context: string[];
  prompt?: string;
}

export interface ExperimentalTextCompleteOutput {
  text: string;
}
