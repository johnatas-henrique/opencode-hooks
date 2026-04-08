export interface EventProperties {
  sessionID?: string;
  messageID?: string;
  tool?: string;
  path?: string;
  event?: string;
  permission?: string;
  decision?: string;
  url?: string;
  directory?: string;
  command?: string;
  uri?: string;
  diagnostics?: Array<Record<string, unknown>>;
  serverID?: string;
  version?: string;
  count?: number;
  cwd?: string;
  title?: string;
  info?: {
    id: string;
    title: string;
  };
  error?: {
    name: string;
    data?: {
      message: string;
    };
  };
  status?: Record<string, unknown>;
  diff?: Array<Record<string, unknown>>;
  agent?: string;
  model?: {
    providerID?: string;
    modelID?: string;
  };
  callID?: string;
  args?: Record<string, unknown>;
  output?: unknown;
  metadata?: Record<string, unknown>;
}

export interface OpenCodeEvent<T extends string = string> {
  type: T;
  properties: EventProperties;
}

export type EventMessagePartRemoved = OpenCodeEvent<'message.part.removed'>;
export type EventMessagePartUpdated = OpenCodeEvent<'message.part.updated'>;
export type EventMessageRemoved = OpenCodeEvent<'message.removed'>;
export type EventMessageUpdated = OpenCodeEvent<'message.updated'>;
export type EventToolExecuteBefore = OpenCodeEvent<'tool.execute.before'>;
export type EventToolExecuteAfter = OpenCodeEvent<'tool.execute.after'>;
export type EventFileEdited = OpenCodeEvent<'file.edited'>;
export type EventFileWatcherUpdated = OpenCodeEvent<'file.watcher.updated'>;
export type EventPermissionAsked = OpenCodeEvent<'permission.asked'>;
export type EventPermissionReplied = OpenCodeEvent<'permission.replied'>;
export type EventServerConnected = OpenCodeEvent<'server.connected'>;
export type EventServerInstanceDisposed =
  OpenCodeEvent<'server.instance.disposed'>;
export type EventCommandExecuted = OpenCodeEvent<'command.executed'>;
export type EventLspClientDiagnostics = OpenCodeEvent<'lsp.client.diagnostics'>;
export type EventLspUpdated = OpenCodeEvent<'lsp.updated'>;
export type EventInstallationUpdated = OpenCodeEvent<'installation.updated'>;
export type EventTodoUpdated = OpenCodeEvent<'todo.updated'>;
export type EventShellEnv = OpenCodeEvent<'shell.env'>;
export type EventTuiPromptAppend = OpenCodeEvent<'tui.prompt.append'>;
export type EventTuiCommandExecute = OpenCodeEvent<'tui.command.execute'>;
export type EventTuiToastShow = OpenCodeEvent<'tui.toast.show'>;
export type EventExperimentalSessionCompacting =
  OpenCodeEvent<'experimental.session.compacting'>;
export type EventChatMessage = OpenCodeEvent<'chat.message'>;
export type EventChatParams = OpenCodeEvent<'chat.params'>;
export type EventChatHeaders = OpenCodeEvent<'chat.headers'>;
export type EventPermissionAsk = OpenCodeEvent<'permission.ask'>;
export type EventCommandExecuteBefore = OpenCodeEvent<'command.execute.before'>;
export type EventExperimentalChatMessagesTransform =
  OpenCodeEvent<'experimental.chat.messages.transform'>;
export type EventExperimentalChatSystemTransform =
  OpenCodeEvent<'experimental.chat.system.transform'>;
export type EventExperimentalTextComplete =
  OpenCodeEvent<'experimental.text.complete'>;
export type EventToolDefinition = OpenCodeEvent<'tool.definition'>;
export type EventMessagePartDelta = OpenCodeEvent<'message.part.delta'>;
export type EventSessionCreated = OpenCodeEvent<'session.created'>;
export type EventSessionCompacted = OpenCodeEvent<'session.compacted'>;
export type EventSessionDeleted = OpenCodeEvent<'session.deleted'>;
export type EventSessionDiff = OpenCodeEvent<'session.diff'>;
export type EventSessionError = OpenCodeEvent<'session.error'>;
export type EventSessionIdle = OpenCodeEvent<'session.idle'>;
export type EventSessionStatus = OpenCodeEvent<'session.status'>;
export type EventSessionUpdated = OpenCodeEvent<'session.updated'>;
