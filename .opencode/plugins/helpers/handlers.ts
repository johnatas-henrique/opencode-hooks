type BuildMessageFn = (event: Record<string, unknown>) => string;

export interface EventHandler {
  title: string;
  variant: 'success' | 'warning' | 'error' | 'info';
  duration: number;
  defaultScript: string;
  buildMessage: BuildMessageFn;
}

const formatTime = (): string => new Date().toLocaleTimeString();

const getProp = (event: Record<string, unknown>, path: string): unknown => {
  const parts = path.split('.');
  let current: unknown = event;
  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
};

const toStr = (value: unknown, fallback = 'unknown'): string => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

export const handlers: Record<string, EventHandler> = {
  'session.created': {
    title: '====SESSION CREATED====',
    variant: 'success',
    duration: 2000,
    defaultScript: 'session-created.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.info.id'))}\n` +
      `Title: ${toStr(getProp(event, 'properties.info.title'))}\n` +
      `Time: ${formatTime()}`,
  },

  'session.compacted': {
    title: '====SESSION COMPACTED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-compacted.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Time: ${formatTime()}`,
  },

  'session.deleted': {
    title: '====SESSION DELETED====',
    variant: 'error',
    duration: 2000,
    defaultScript: 'session-deleted.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.info.id'))}\n` +
      `Time: ${formatTime()}`,
  },

  'session.error': {
    title: '====SESSION ERROR====',
    variant: 'error',
    duration: 30000,
    defaultScript: 'session-error.sh',
    buildMessage: (event) => {
      const error = getProp(event, 'properties.error') as
        | Record<string, unknown>
        | undefined;
      const errorName = error?.name ? String(error.name) : 'Unknown error';
      const errorMessage = getProp(event, 'properties.error.data.message');
      const messageStr = errorMessage
        ? String(errorMessage)
        : 'Unknown message';
      return (
        `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
        `Error: ${errorName}\n` +
        `Message: ${messageStr}\n` +
        `Time: ${formatTime()}`
      );
    },
  },

  'session.diff': {
    title: '====SESSION DIFF====',
    variant: 'warning',
    duration: 2000,
    defaultScript: 'session-diff.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Time: ${formatTime()}`,
  },

  'session.idle': {
    title: '====IDLE SESSION====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-idle.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Time: ${formatTime()}`,
  },

  'session.status': {
    title: '====SESSION STATUS====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-status.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Status: ${JSON.stringify(getProp(event, 'properties.status'))}\n` +
      `Time: ${formatTime()}`,
  },

  'session.updated': {
    title: '====UPDATED SESSION====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-updated.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.info.id'))}\n` +
      `Time: ${formatTime()}`,
  },

  'message.part.removed': {
    title: '====MESSAGE PART REMOVED====',
    variant: 'warning',
    duration: 2000,
    defaultScript: 'message-part-removed.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Message Id: ${toStr(getProp(event, 'properties.messageID'))}\n` +
      `Time: ${formatTime()}`,
  },

  'message.part.updated': {
    title: '====MESSAGE PART UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'message-part-updated.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Message Id: ${toStr(getProp(event, 'properties.messageID'))}\n` +
      `Time: ${formatTime()}`,
  },

  'message.removed': {
    title: '====MESSAGE REMOVED====',
    variant: 'warning',
    duration: 2000,
    defaultScript: 'message-removed.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Message Id: ${toStr(getProp(event, 'properties.messageID'))}\n` +
      `Time: ${formatTime()}`,
  },

  'message.updated': {
    title: '====MESSAGE UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'message-updated.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Message Id: ${toStr(getProp(event, 'properties.messageID'))}\n` +
      `Time: ${formatTime()}`,
  },

  'tool.execute.before': {
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tool-execute-before.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Tool: ${toStr(getProp(event, 'properties.tool'))}\n` +
      `Time: ${formatTime()}`,
  },

  'tool.execute.after': {
    title: '====SUBAGENT CALLED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tool-execute-after.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Tool: ${toStr(getProp(event, 'properties.tool'))}\n` +
      `Time: ${formatTime()}`,
  },

  'file.edited': {
    title: '====FILE EDITED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'file-edited.sh',
    buildMessage: (event) =>
      `File: ${toStr(getProp(event, 'properties.path'))}\n` +
      `Time: ${formatTime()}`,
  },

  'file.watcher.updated': {
    title: '====FILE WATCHER UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'file-watcher-updated.sh',
    buildMessage: (event) =>
      `File: ${toStr(getProp(event, 'properties.path'))}\n` +
      `Event: ${toStr(getProp(event, 'properties.event'))}\n` +
      `Time: ${formatTime()}`,
  },

  'permission.asked': {
    title: '====PERMISSION ASKED====',
    variant: 'warning',
    duration: 5000,
    defaultScript: 'permission-asked.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Permission: ${toStr(getProp(event, 'properties.permission'))}\n` +
      `Time: ${formatTime()}`,
  },

  'permission.replied': {
    title: '====PERMISSION REPLIED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'permission-replied.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Decision: ${toStr(getProp(event, 'properties.decision'))}\n` +
      `Time: ${formatTime()}`,
  },

  'server.connected': {
    title: '====SERVER CONNECTED====',
    variant: 'success',
    duration: 2000,
    defaultScript: 'server-connected.sh',
    buildMessage: (event) =>
      `URL: ${toStr(getProp(event, 'properties.url'))}\n` +
      `Time: ${formatTime()}`,
  },

  'server.instance.disposed': {
    title: '',
    variant: 'info',
    duration: 0,
    defaultScript: 'session-stop.sh',
    buildMessage: (event) =>
      `Directory: ${toStr(getProp(event, 'properties.directory'))}\n` +
      `Time: ${formatTime()}`,
  },

  'command.executed': {
    title: '====COMMAND EXECUTED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'command-executed.sh',
    buildMessage: (event) =>
      `Command: ${toStr(getProp(event, 'properties.command'))}\n` +
      `Time: ${formatTime()}`,
  },

  'lsp.client.diagnostics': {
    title: '====LSP DIAGNOSTICS====',
    variant: 'warning',
    duration: 2000,
    defaultScript: 'lsp-client-diagnostics.sh',
    buildMessage: (event) => {
      const diagnostics = getProp(event, 'properties.diagnostics') as
        | Array<unknown>
        | undefined;
      return (
        `File: ${toStr(getProp(event, 'properties.uri'))}\n` +
        `Diagnostics: ${diagnostics?.length ?? 0}\n` +
        `Time: ${formatTime()}`
      );
    },
  },

  'lsp.updated': {
    title: '====LSP UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'lsp-updated.sh',
    buildMessage: (event) =>
      `Server: ${toStr(getProp(event, 'properties.serverID'))}\n` +
      `Time: ${formatTime()}`,
  },

  'installation.updated': {
    title: '====INSTALLATION UPDATED====',
    variant: 'success',
    duration: 2000,
    defaultScript: 'installation-updated.sh',
    buildMessage: (event) =>
      `Version: ${toStr(getProp(event, 'properties.version'))}\n` +
      `Time: ${formatTime()}`,
  },

  'todo.updated': {
    title: '====TODO UPDATED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'todo-updated.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Count: ${toStr(getProp(event, 'properties.count'), '0')}\n` +
      `Time: ${formatTime()}`,
  },

  'shell.env': {
    title: '====SHELL ENV====',
    variant: 'info',
    duration: 0,
    defaultScript: 'shell-env.sh',
    buildMessage: (event) =>
      `Directory: ${toStr(getProp(event, 'properties.cwd'))}\n` +
      `Time: ${formatTime()}`,
  },

  'tui.prompt.append': {
    title: '====TUI PROMPT APPEND====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tui-prompt-append.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Time: ${formatTime()}`,
  },

  'tui.command.execute': {
    title: '====TUI COMMAND EXECUTE====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tui-command-execute.sh',
    buildMessage: (event) =>
      `Command: ${toStr(getProp(event, 'properties.command'))}\n` +
      `Time: ${formatTime()}`,
  },

  'tui.toast.show': {
    title: '====TUI TOAST SHOW====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tui-toast-show.sh',
    buildMessage: (event) =>
      `Title: ${toStr(getProp(event, 'properties.title'))}\n` +
      `Time: ${formatTime()}`,
  },

  'experimental.session.compacting': {
    title: '====SESSION COMPACTING====',
    variant: 'warning',
    duration: 2000,
    defaultScript: 'session-compacting.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, 'properties.sessionID'))}\n` +
      `Time: ${formatTime()}`,
  },
};
