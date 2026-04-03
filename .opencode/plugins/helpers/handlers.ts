import type {
  EventSessionCreated,
  EventSessionCompacted,
  EventSessionDeleted,
  EventSessionError,
  EventSessionDiff,
  EventSessionIdle,
  EventSessionStatus,
  EventSessionUpdated,
} from '@opencode-ai/sdk';

export interface EventHandler<T = any> {
  title: string;
  variant: 'success' | 'warning' | 'error' | 'info';
  duration: number;
  defaultScript: string;
  buildMessage: (event: T) => string;
}

const formatTime = (): string => new Date().toLocaleTimeString();

export const handlers: Record<string, EventHandler> = {
  // Session Events (8)
  'session.created': {
    title: '====SESSION CREATED====',
    variant: 'success',
    duration: 2000,
    defaultScript: 'session-created.sh',
    buildMessage: (event: EventSessionCreated) =>
      `Session Id: ${event.properties.info.id}\n` +
      `Title: ${event.properties.info.title}\n` +
      `Time: ${formatTime()}`,
  },

  'session.compacted': {
    title: '====SESSION COMPACTED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-compacted.sh',
    buildMessage: (event: EventSessionCompacted) =>
      `Session Id: ${event.properties.sessionID}\n` + `Time: ${formatTime()}`,
  },

  'session.deleted': {
    title: '====SESSION DELETED====',
    variant: 'error',
    duration: 2000,
    defaultScript: 'session-deleted.sh',
    buildMessage: (event: EventSessionDeleted) =>
      `Session Id: ${event.properties.info.id}\n` + `Time: ${formatTime()}`,
  },

  'session.error': {
    title: '====SESSION ERROR====',
    variant: 'error',
    duration: 30000,
    defaultScript: 'session-error.sh',
    buildMessage: (event: EventSessionError) =>
      `Session Id: ${event.properties.sessionID}\n` +
      `Error: ${event.properties.error?.name || 'Unknown error'}\n` +
      `Message: ${event.properties.error?.data?.message || 'Unknown message'}\n` +
      `Time: ${formatTime()}`,
  },

  'session.diff': {
    title: '====SESSION DIFF====',
    variant: 'warning',
    duration: 2000,
    defaultScript: 'session-diff.sh',
    buildMessage: (event: EventSessionDiff) =>
      `Session Id: ${event.properties.sessionID}\n` + `Time: ${formatTime()}`,
  },

  'session.idle': {
    title: '====IDLE SESSION====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-idle.sh',
    buildMessage: (event: EventSessionIdle) =>
      `Session Id: ${event.properties.sessionID}\n` + `Time: ${formatTime()}`,
  },

  'session.status': {
    title: '====SESSION STATUS====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-status.sh',
    buildMessage: (event: EventSessionStatus) =>
      `Session Id: ${event.properties.sessionID}\n` +
      `Status: ${JSON.stringify(event.properties.status)}\n` +
      `Time: ${formatTime()}`,
  },

  'session.updated': {
    title: '====UPDATED SESSION====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-updated.sh',
    buildMessage: (event: EventSessionUpdated) =>
      `Session Id: ${event.properties.info.id}\n` + `Time: ${formatTime()}`,
  },

  // Message Events (4)
  'message.part.removed': {
    title: '====MESSAGE PART REMOVED====',
    variant: 'warning',
    duration: 2000,
    defaultScript: 'message-part-removed.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Message Id: ${event.properties?.messageID || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  'message.part.updated': {
    title: '====MESSAGE PART UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'message-part-updated.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Message Id: ${event.properties?.messageID || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  'message.removed': {
    title: '====MESSAGE REMOVED====',
    variant: 'warning',
    duration: 2000,
    defaultScript: 'message-removed.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Message Id: ${event.properties?.messageID || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  'message.updated': {
    title: '====MESSAGE UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'message-updated.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Message Id: ${event.properties?.messageID || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  // Tool Events (2)
  'tool.execute.before': {
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tool-execute-before.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Tool: ${event.properties?.tool || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  'tool.execute.after': {
    title: '====SUBAGENT CALLED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tool-execute-after.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Tool: ${event.properties?.tool || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  // File Events (2)
  'file.edited': {
    title: '====FILE EDITED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'file-edited.sh',
    buildMessage: (event: any) =>
      `File: ${event.properties?.path || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  'file.watcher.updated': {
    title: '====FILE WATCHER UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'file-watcher-updated.sh',
    buildMessage: (event: any) =>
      `File: ${event.properties?.path || 'unknown'}\n` +
      `Event: ${event.properties?.event || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  // Permission Events (2)
  'permission.asked': {
    title: '====PERMISSION ASKED====',
    variant: 'warning',
    duration: 5000,
    defaultScript: 'permission-asked.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Permission: ${event.properties?.permission || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  'permission.replied': {
    title: '====PERMISSION REPLIED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'permission-replied.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Decision: ${event.properties?.decision || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  // Server Events (2)
  'server.connected': {
    title: '====SERVER CONNECTED====',
    variant: 'success',
    duration: 2000,
    defaultScript: 'server-connected.sh',
    buildMessage: (event: any) =>
      `URL: ${event.properties?.url || 'unknown'}\n` + `Time: ${formatTime()}`,
  },

  'server.instance.disposed': {
    title: '',
    variant: 'info',
    duration: 0,
    defaultScript: 'session-stop.sh',
    buildMessage: (event: any) =>
      `Directory: ${event.properties.directory || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  // Command Events (1)
  'command.executed': {
    title: '====COMMAND EXECUTED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'command-executed.sh',
    buildMessage: (event: any) =>
      `Command: ${event.properties?.command || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  // LSP Events (2)
  'lsp.client.diagnostics': {
    title: '====LSP DIAGNOSTICS====',
    variant: 'warning',
    duration: 2000,
    defaultScript: 'lsp-client-diagnostics.sh',
    buildMessage: (event: any) =>
      `File: ${event.properties?.uri || 'unknown'}\n` +
      `Diagnostics: ${event.properties?.diagnostics?.length || 0}\n` +
      `Time: ${formatTime()}`,
  },

  'lsp.updated': {
    title: '====LSP UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'lsp-updated.sh',
    buildMessage: (event: any) =>
      `Server: ${event.properties?.serverID || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  // Installation Events (1)
  'installation.updated': {
    title: '====INSTALLATION UPDATED====',
    variant: 'success',
    duration: 2000,
    defaultScript: 'installation-updated.sh',
    buildMessage: (event: any) =>
      `Version: ${event.properties?.version || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  // Todo Events (1)
  'todo.updated': {
    title: '====TODO UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'todo-updated.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Count: ${event.properties?.count || 0}\n` +
      `Time: ${formatTime()}`,
  },

  // Shell Events (1)
  'shell.env': {
    title: '====SHELL ENV====',
    variant: 'info',
    duration: 0,
    defaultScript: 'shell-env.sh',
    buildMessage: (event: any) =>
      `Directory: ${event.properties?.cwd || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  // TUI Events (3)
  'tui.prompt.append': {
    title: '====TUI PROMPT APPEND====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tui-prompt-append.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  'tui.command.execute': {
    title: '====TUI COMMAND EXECUTE====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tui-command-execute.sh',
    buildMessage: (event: any) =>
      `Command: ${event.properties?.command || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  'tui.toast.show': {
    title: '====TUI TOAST SHOW====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tui-toast-show.sh',
    buildMessage: (event: any) =>
      `Title: ${event.properties?.title || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },

  // Experimental Events (1)
  'experimental.session.compacting': {
    title: '====SESSION COMPACTING====',
    variant: 'warning',
    duration: 2000,
    defaultScript: 'session-compacting.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Time: ${formatTime()}`,
  },
};
