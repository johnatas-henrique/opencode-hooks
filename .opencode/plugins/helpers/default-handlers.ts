import { TOAST_DURATION } from './constants';

type BuildMessageFn = (event: Record<string, unknown>) => string;

export interface EventHandler {
  title: string;
  variant: 'success' | 'warning' | 'error' | 'info';
  duration: number;
  defaultScript: string;
  buildMessage: BuildMessageFn;
}

const formatTime = (): string => new Date().toLocaleTimeString();

export const getProp = (
  event: Record<string, unknown>,
  path: string
): unknown => {
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

interface HandlerConfig {
  title: string;
  variant: EventHandler['variant'];
  duration: number;
  defaultScript: string;
  props: Record<string, string>;
}

const createHandler = (config: HandlerConfig): EventHandler => ({
  title: config.title,
  variant: config.variant,
  duration: config.duration,
  defaultScript: config.defaultScript,
  buildMessage: (event) => {
    const lines = Object.entries(config.props)
      .map(([label, path]) => `${label}: ${toStr(getProp(event, path))}`)
      .join('\n');
    return `${lines}\nTime: ${formatTime()}`;
  },
});

const SESSION_ID = 'properties.sessionID';
const INFO_ID = 'properties.info.id';
const MESSAGE_ID = 'properties.messageID';

export const handlers: Record<string, EventHandler> = {
  'session.created': createHandler({
    title: '====SESSION CREATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-created.sh',
    props: {
      'Session Id': INFO_ID,
      Title: 'properties.info.title',
    },
  }),

  'session.compacted': createHandler({
    title: '====SESSION COMPACTED====',
    variant: 'info',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'session-compacted.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'session.deleted': createHandler({
    title: '====SESSION DELETED====',
    variant: 'error',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-deleted.sh',
    props: { 'Session Id': INFO_ID },
  }),

  'session.error': {
    title: '====SESSION ERROR====',
    variant: 'error',
    duration: TOAST_DURATION.THIRTY_SECONDS,
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
        `Session Id: ${toStr(getProp(event, SESSION_ID))}\n` +
        `Error: ${errorName}\n` +
        `Message: ${messageStr}\n` +
        `Time: ${formatTime()}`
      );
    },
  },

  'session.diff': createHandler({
    title: '====SESSION DIFF====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-diff.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'session.idle': createHandler({
    title: '====IDLE SESSION====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-idle.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'session.status': {
    title: '====SESSION STATUS====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-status.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, SESSION_ID))}\n` +
      `Status: ${JSON.stringify(getProp(event, 'properties.status'))}\n` +
      `Time: ${formatTime()}`,
  },

  'session.updated': createHandler({
    title: '====UPDATED SESSION====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-updated.sh',
    props: { 'Session Id': INFO_ID },
  }),

  'message.part.removed': createHandler({
    title: '====MESSAGE PART REMOVED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-part-removed.sh',
    props: { 'Session Id': SESSION_ID, 'Message Id': MESSAGE_ID },
  }),

  'message.part.updated': createHandler({
    title: '====MESSAGE PART UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-part-updated.sh',
    props: { 'Session Id': SESSION_ID, 'Message Id': MESSAGE_ID },
  }),

  'message.part.delta': createHandler({
    title: '====MESSAGE PART DELTA====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-part-delta.sh',
    props: { 'Session Id': SESSION_ID, 'Message Id': MESSAGE_ID },
  }),

  'message.removed': createHandler({
    title: '====MESSAGE REMOVED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-removed.sh',
    props: { 'Session Id': SESSION_ID, 'Message Id': MESSAGE_ID },
  }),

  'message.updated': createHandler({
    title: '====MESSAGE UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-updated.sh',
    props: { 'Session Id': SESSION_ID, 'Message Id': MESSAGE_ID },
  }),

  'tool.execute.before': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.sh',
    props: { 'Session Id': SESSION_ID, Tool: 'properties.tool' },
  }),

  'tool.execute.after': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.sh',
    props: { 'Session Id': SESSION_ID, Tool: 'properties.tool' },
  }),

  'file.edited': createHandler({
    title: '====FILE EDITED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'file-edited.sh',
    props: { File: 'properties.path' },
  }),

  'file.watcher.updated': createHandler({
    title: '====FILE WATCHER UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'file-watcher-updated.sh',
    props: { File: 'properties.path', Event: 'properties.event' },
  }),

  'permission.asked': createHandler({
    title: '====PERMISSION ASKED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'permission-asked.sh',
    props: { 'Session Id': SESSION_ID, Permission: 'properties.permission' },
  }),

  'permission.replied': createHandler({
    title: '====PERMISSION REPLIED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'permission-replied.sh',
    props: { 'Session Id': SESSION_ID, Decision: 'properties.decision' },
  }),

  'server.connected': createHandler({
    title: '====SERVER CONNECTED====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'server-connected.sh',
    props: { URL: 'properties.url' },
  }),

  'server.instance.disposed': createHandler({
    title: '====SERVER INSTANCE DISPOSED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-stop.sh',
    props: { Directory: 'properties.directory' },
  }),

  'command.executed': createHandler({
    title: '====COMMAND EXECUTED====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'command-executed.sh',
    props: { Command: 'properties.command' },
  }),

  'lsp.client.diagnostics': {
    title: '====LSP DIAGNOSTICS====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
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

  'lsp.updated': createHandler({
    title: '====LSP UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'lsp-updated.sh',
    props: { Server: 'properties.serverID' },
  }),

  'installation.updated': createHandler({
    title: '====INSTALLATION UPDATED====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'installation-updated.sh',
    props: { Version: 'properties.version' },
  }),

  'todo.updated': {
    title: '====TODO UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'todo-updated.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, SESSION_ID))}\n` +
      `Count: ${toStr(getProp(event, 'properties.count'), '0')}\n` +
      `Time: ${formatTime()}`,
  },

  'shell.env': createHandler({
    title: '====SHELL ENV====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'shell-env.sh',
    props: { Directory: 'properties.cwd' },
  }),

  'tui.prompt.append': createHandler({
    title: '====TUI PROMPT APPEND====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tui-prompt-append.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tui.command.execute': createHandler({
    title: '====TUI COMMAND EXECUTE====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tui-command-execute.sh',
    props: { Command: 'properties.command' },
  }),

  'tui.toast.show': createHandler({
    title: '====TUI TOAST SHOW====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tui-toast-show.sh',
    props: { Title: 'properties.title' },
  }),

  'experimental.session.compacting': createHandler({
    title: '====SESSION COMPACTING====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-compacting.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'chat.message': createHandler({
    title: '====CHAT MESSAGE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'chat-message.sh',
    props: {
      'Session Id': 'sessionID',
      Agent: 'agent',
      'Message Id': 'messageID',
    },
  }),

  'chat.params': createHandler({
    title: '====CHAT PARAMS====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'chat-params.sh',
    props: {
      'Session Id': 'sessionID',
      Agent: 'agent',
      Model: 'model.modelID',
    },
  }),

  'chat.headers': createHandler({
    title: '====CHAT HEADERS====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'chat-headers.sh',
    props: { 'Session Id': 'sessionID', Agent: 'agent' },
  }),

  'permission.ask': createHandler({
    title: '====PERMISSION ASK====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'permission-ask.sh',
    props: { 'Session Id': 'sessionID', Tool: 'tool' },
  }),

  'command.execute.before': createHandler({
    title: '====COMMAND EXECUTE BEFORE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'command-execute-before.sh',
    props: { Command: 'command', 'Session Id': 'sessionID' },
  }),

  'experimental.chat.messages.transform': createHandler({
    title: '====CHAT MESSAGES TRANSFORM====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'experimental-chat-messages-transform.sh',
    props: { 'Session Id': 'sessionID' },
  }),

  'experimental.chat.system.transform': createHandler({
    title: '====CHAT SYSTEM TRANSFORM====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'experimental-chat-system-transform.sh',
    props: { 'Session Id': 'sessionID', Model: 'model.modelID' },
  }),

  'experimental.text.complete': createHandler({
    title: '====TEXT COMPLETE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'experimental-text-complete.sh',
    props: {
      'Session Id': 'sessionID',
      'Message Id': 'messageID',
      'Part Id': 'partID',
    },
  }),

  'tool.definition': createHandler({
    title: '====TOOL DEFINITION====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-definition.sh',
    props: { 'Tool Id': 'toolID' },
  }),
};
