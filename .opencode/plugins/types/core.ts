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
  TOOL_EXECUTE_BEFORE_SUBAGENT: 'tool.execute.before.subagent',

  TUI_PROMPT_APPEND: 'tui.prompt.append',
  TUI_COMMAND_EXECUTE: 'tui.command.execute',
  TUI_TOAST_SHOW: 'tui.toast.show',

  PTY_CREATED: 'pty.created',
  PTY_UPDATED: 'pty.updated',
  PTY_EXITED: 'pty.exited',
  PTY_DELETED: 'pty.deleted',

  MESSAGE_PART_DELTA: 'message.part.delta',
  PERMISSION_ASKED: 'permission.asked',
  PERMISSION_ASK: 'permission.ask',
  COMMAND_EXECUTE_BEFORE: 'command.execute.before',
  EXPERIMENTAL_SESSION_COMPACTING: 'experimental.session.compacting',
  CHAT_MESSAGE: 'chat.message',
  CHAT_PARAMS: 'chat.params',
  CHAT_HEADERS: 'chat.headers',
  EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM: 'experimental.chat.messages.transform',
  EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM: 'experimental.chat.system.transform',
  EXPERIMENTAL_TEXT_COMPLETE: 'experimental.text.complete',
  TOOL_DEFINITION: 'tool.definition',
  SESSION_UNKNOWN: 'session.unknown',
} as const;

export interface ToolArgs {
  command?: string;
  filePath?: string;
  path?: string;
  pattern?: string;
  url?: string;
  query?: string;
  name?: string;
  message?: string;
  source?: string;
  destination?: string;
  [key: string]: unknown;
}

export type OpenCodeEventType =
  (typeof OpenCodeEvents)[keyof typeof OpenCodeEvents];

export type OpenCodeEventMap = {
  [K in OpenCodeEventType]: Event & { type: K };
};

export type OpenCodeEventProperties<T extends OpenCodeEventType> =
  OpenCodeEventMap[T]['properties'];

export type OpenCodeEventHandler<T extends OpenCodeEventType> = (input: {
  event: OpenCodeEventMap[T];
}) => Promise<void>;

export type ToolExecuteAfterInput = {
  tool: string;
  sessionID: string;
  callID: string;
  args: ToolArgs;
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
  args: ToolArgs;
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
  sessionID: string;
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
  sessionID?: string; // Optional: server events may not have session
}

// Tool Events Properties
export interface ToolExecuteAfterProps {
  tool: string;
  sessionID: string;
  callID: string;
  args: ToolArgs;
  subagentType?: string;
}

export interface ToolExecuteBeforeProps {
  tool: string;
  sessionID: string;
  callID?: string;
  args?: ToolArgs;
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

// Message Part Delta Properties
export interface MessagePartDeltaProps {
  sessionID: string;
  messageID: string;
  partID: string;
  field: string;
  delta: string;
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
  sessionID: string;
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
  sessionID: string;
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
  sessionID: string;
  messages: Message[];
}

export interface ExperimentalChatSystemTransformProps {
  sessionID: string;
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
export interface EventInput {
  sessionID?: string;
  tool?: string;
  callID?: string;
  args?: Record<string, unknown>;
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

// ============================================
// Normalized Event Types (Union)
// ============================================

export type ToolBeforeNormalized = {
  type: 'tool.before';
  input: ToolExecuteBeforeInput;
  output: ToolExecuteBeforeOutput;
};

export type ToolAfterNormalized = {
  type: 'tool.after';
  input: ToolExecuteAfterInput;
  output: ToolExecuteAfterOutput;
};

export type ToolNormalized = ToolBeforeNormalized | ToolAfterNormalized;

export type SessionCreatedNormalized = {
  type: 'session.created';
  properties: {
    info: {
      id: string;
      title: string;
      parentID?: string;
    };
    sessionID?: string;
  };
};

export type SessionUpdatedNormalized = {
  type: 'session.updated';
  properties: {
    info: {
      id: string;
      title: string;
    };
    sessionID?: string;
  };
};

export type SessionDeletedNormalized = {
  type: 'session.deleted';
  properties: {
    info: { id: string };
  };
};

export type SessionErrorNormalized = {
  type: 'session.error';
  properties: {
    sessionID?: string;
    error?: {
      name?: string;
      data?: { message?: string };
    };
  };
};

export type SessionIdleNormalized = {
  type: 'session.idle';
  properties: { sessionID: string };
};

export type SessionCompactedNormalized = {
  type: 'session.compacted';
  properties: { sessionID: string };
};

export type SessionDiffNormalized = {
  type: 'session.diff';
  properties: { sessionID: string };
};

export type SessionStatusNormalized = {
  type: 'session.status';
  properties: { sessionID: string; status: unknown };
};

export type MessageUpdatedNormalized = {
  type: 'message.updated';
  properties: { info: unknown };
};

export type MessageRemovedNormalized = {
  type: 'message.removed';
  properties: { sessionID: string; messageID: string };
};

export type MessagePartUpdatedNormalized = {
  type: 'message.part.updated';
  properties: { part: unknown; delta?: string };
};

export type MessagePartRemovedNormalized = {
  type: 'message.part.removed';
  properties: { sessionID: string; messageID: string; partID: string };
};

export type FileEditedNormalized = {
  type: 'file.edited';
  properties: { file: string };
};

export type FileWatcherUpdatedNormalized = {
  type: 'file.watcher.updated';
  properties: { file: string; event: string };
};

export type ShellEnvNormalized = {
  type: 'shell.env';
  properties: { cwd: string; sessionID?: string; callID?: string };
  output: { env: Record<string, string> };
};

export type PermissionAskNormalized = {
  type: 'permission.asked';
  properties: {
    sessionID?: string;
    tool?: string;
    id?: string;
    type?: string;
    pattern?: string | string[];
    messageID?: string;
    callID?: string;
    title?: string;
  };
  output: { status: string };
};

export type PermissionUpdatedNormalized = {
  type: 'permission.updated';
  properties: {
    id: string;
    type: string;
    pattern?: string | string[];
    sessionID: string;
    messageID: string;
    title: string;
  };
};

export type PermissionRepliedNormalized = {
  type: 'permission.replied';
  properties: { sessionID: string; permissionID: string; response: string };
};

export type CommandExecuteBeforeNormalized = {
  type: 'command.execute.before';
  properties: { command: string; sessionID: string; arguments: string };
  output: { parts: unknown[] };
};

export type CommandExecutedNormalized = {
  type: 'command.executed';
  properties: {
    name: string;
    sessionID: string;
    arguments: string;
    messageID: string;
  };
};

export type ChatMessageNormalized = {
  type: 'chat.message';
  properties: {
    sessionID: string;
    agent?: string;
    model?: { providerID: string; modelID: string };
    messageID?: string;
    variant?: string;
  };
  output: { message: unknown; parts: unknown[] };
};

export type ChatParamsNormalized = {
  type: 'chat.params';
  properties: {
    sessionID: string;
    agent: string;
    model: unknown;
    provider: unknown;
    message: unknown;
  };
  output: { temperature: number; topP: number; topK: number; options: unknown };
};

export type ChatHeadersNormalized = {
  type: 'chat.headers';
  properties: {
    sessionID: string;
    agent: string;
    model: unknown;
    provider: unknown;
    message: unknown;
  };
  output: { headers: Record<string, string> };
};

export type ToolDefinitionNormalized = {
  type: 'tool.definition';
  properties: { toolID: string };
  output: { description: string; parameters: unknown };
};

export type ExperimentalChatMessagesTransformNormalized = {
  type: 'experimental.chat.messages.transform';
  properties: { sessionID?: string; messages: unknown[] };
  output: { messages: unknown[] };
};

export type ExperimentalChatSystemTransformNormalized = {
  type: 'experimental.chat.system.transform';
  properties: { sessionID?: string; model: unknown };
  output: { system: string[] };
};

export type ExperimentalSessionCompactingNormalized = {
  type: 'experimental.session.compacting';
  properties: { sessionID: string };
  output: { context: string[]; prompt?: string };
};

export type ExperimentalTextCompleteNormalized = {
  type: 'experimental.text.complete';
  properties: { sessionID: string; messageID: string; partID: string };
  output: { text: string };
};

export type LspClientDiagnosticsNormalized = {
  type: 'lsp.client.diagnostics';
  properties: { serverID: string; path: string };
};

export type LspUpdatedNormalized = {
  type: 'lsp.updated';
  properties: Record<string, unknown>;
};

export type InstallationUpdatedNormalized = {
  type: 'installation.updated';
  properties: { version: string };
};

export type TodoUpdatedNormalized = {
  type: 'todo.updated';
  properties: { sessionID: string; todos: unknown[] };
};

export type TuiPromptAppendNormalized = {
  type: 'tui.prompt.append';
  properties: { text: string };
};

export type TuiCommandExecuteNormalized = {
  type: 'tui.command.execute';
  properties: { command: string | string[] };
};

export type TuiToastShowNormalized = {
  type: 'tui.toast.show';
  properties: {
    title?: string;
    message: string;
    variant: string;
    duration?: number;
  };
};

export type PtyCreatedNormalized = {
  type: 'pty.created';
  properties: { info: unknown };
};

export type PtyUpdatedNormalized = {
  type: 'pty.updated';
  properties: { info: unknown };
};

export type PtyExitedNormalized = {
  type: 'pty.exited';
  properties: { id: string; exitCode: number };
};

export type PtyDeletedNormalized = {
  type: 'pty.deleted';
  properties: { id: string };
};

export type ServerConnectedNormalized = {
  type: 'server.connected';
  properties: Record<string, unknown>;
};

export type ServerInstanceDisposedNormalized = {
  type: 'server.instance.disposed';
  properties: { directory: string; sessionID?: string };
};

export type VcsBranchUpdatedNormalized = {
  type: 'vcs.branch.updated';
  properties: { branch?: string };
};

export type UnknownNormalized = {
  type: 'unknown';
  properties: Record<string, unknown>;
};

export type PropertiesNormalized =
  | SessionCreatedNormalized
  | SessionUpdatedNormalized
  | SessionDeletedNormalized
  | SessionErrorNormalized
  | SessionIdleNormalized
  | SessionCompactedNormalized
  | SessionDiffNormalized
  | SessionStatusNormalized
  | MessageUpdatedNormalized
  | MessageRemovedNormalized
  | MessagePartUpdatedNormalized
  | MessagePartRemovedNormalized
  | FileEditedNormalized
  | FileWatcherUpdatedNormalized
  | ShellEnvNormalized
  | PermissionAskNormalized
  | PermissionUpdatedNormalized
  | PermissionRepliedNormalized
  | CommandExecuteBeforeNormalized
  | CommandExecutedNormalized
  | ChatMessageNormalized
  | ChatParamsNormalized
  | ChatHeadersNormalized
  | ToolDefinitionNormalized
  | ExperimentalChatMessagesTransformNormalized
  | ExperimentalChatSystemTransformNormalized
  | ExperimentalSessionCompactingNormalized
  | ExperimentalTextCompleteNormalized
  | LspClientDiagnosticsNormalized
  | LspUpdatedNormalized
  | InstallationUpdatedNormalized
  | TodoUpdatedNormalized
  | TuiPromptAppendNormalized
  | TuiCommandExecuteNormalized
  | TuiToastShowNormalized
  | PtyCreatedNormalized
  | PtyUpdatedNormalized
  | PtyExitedNormalized
  | PtyDeletedNormalized
  | ServerConnectedNormalized
  | ServerInstanceDisposedNormalized
  | VcsBranchUpdatedNormalized
  | UnknownNormalized;

export type NormalizedEvent = ToolNormalized | PropertiesNormalized;
