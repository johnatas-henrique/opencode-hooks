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
  props?: Record<string, string>;
  buildMessage?: (event: Record<string, unknown>) => string;
}

const createHandler = (config: HandlerConfig): EventHandler => ({
  title: config.title,
  variant: config.variant,
  duration: config.duration,
  defaultScript: config.defaultScript,
  buildMessage:
    config.buildMessage ??
    ((event) => {
      const lines = Object.entries(config.props ?? {})
        .map(([label, path]) => `${label}: ${toStr(getProp(event, path))}`)
        .join('\n');
      return `${lines}\nTime: ${formatTime()}`;
    }),
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

  'session.error': createHandler({
    title: '====SESSION ERROR====',
    variant: 'error',
    duration: TOAST_DURATION.FIVE_SECONDS,
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
  }),

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

  'session.status': createHandler({
    title: '====SESSION STATUS====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-status.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, SESSION_ID))}\n` +
      `Status: ${JSON.stringify(getProp(event, 'properties.status'))}\n` +
      `Time: ${formatTime()}`,
  }),

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

  'tool.execute.after.subagent': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.subagent.sh',
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

  'lsp.client.diagnostics': createHandler({
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
        `Diagnostics: ${diagnostics ? diagnostics.length : 0}\n` +
        `Time: ${formatTime()}`
      );
    },
  }),

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

  'todo.updated': createHandler({
    title: '====TODO UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'todo-updated.sh',
    buildMessage: (event) =>
      `Session Id: ${toStr(getProp(event, SESSION_ID))}\n` +
      `Count: ${toStr(getProp(event, 'properties.count'), '0')}\n` +
      `Time: ${formatTime()}`,
  }),

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

  'tool.execute.before.task': createHandler({
    title: '====TASK BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-before-task.sh',
    props: { 'Session Id': SESSION_ID, 'Subagent Id': 'properties.sessionID' },
  }),

  'tool.execute.after.task': createHandler({
    title: '====TASK AFTER====',
    variant: 'success',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-after-task.sh',
    props: { 'Session Id': SESSION_ID, 'Subagent Id': 'properties.sessionID' },
  }),

  'tool.execute.before.skill': createHandler({
    title: '====SKILL BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-before-skill.sh',
    props: { 'Session Id': SESSION_ID, 'Skill Id': 'properties.tool.input' },
  }),

  'tool.execute.after.skill': createHandler({
    title: '====SKILL AFTER====',
    variant: 'success',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-after-skill.sh',
    props: { 'Session Id': SESSION_ID, 'Skill Id': 'properties.tool.input' },
  }),

  'tool.execute.before.bash': createHandler({
    title: '====BASH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-bash.sh',
    props: { 'Session Id': SESSION_ID, Command: 'properties.tool.input' },
  }),

  'tool.execute.after.bash': createHandler({
    title: '====BASH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-bash.sh',
    props: { 'Session Id': SESSION_ID, Command: 'properties.tool.input' },
  }),

  'tool.execute.before.write': createHandler({
    title: '====WRITE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-write.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.after.write': createHandler({
    title: '====WRITE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-write.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.before.edit': createHandler({
    title: '====EDIT BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-edit.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.after.edit': createHandler({
    title: '====EDIT AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-edit.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.before.read': createHandler({
    title: '====READ BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-read.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.after.read': createHandler({
    title: '====READ AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-read.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.before.glob': createHandler({
    title: '====GLOB BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-glob.sh',
    props: { 'Session Id': SESSION_ID, Pattern: 'properties.tool.input' },
  }),

  'tool.execute.after.glob': createHandler({
    title: '====GLOB AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-glob.sh',
    props: { 'Session Id': SESSION_ID, Pattern: 'properties.tool.input' },
  }),

  'tool.execute.before.grep': createHandler({
    title: '====GREP BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-grep.sh',
    props: { 'Session Id': SESSION_ID, Pattern: 'properties.tool.input' },
  }),

  'tool.execute.after.grep': createHandler({
    title: '====GREP AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-grep.sh',
    props: { 'Session Id': SESSION_ID, Pattern: 'properties.tool.input' },
  }),

  'tool.execute.before.list': createHandler({
    title: '====LIST BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-list.sh',
    props: { 'Session Id': SESSION_ID, Directory: 'properties.path' },
  }),

  'tool.execute.after.list': createHandler({
    title: '====LIST AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-list.sh',
    props: { 'Session Id': SESSION_ID, Directory: 'properties.path' },
  }),

  'tool.execute.before.patch': createHandler({
    title: '====PATCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-patch.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.after.patch': createHandler({
    title: '====PATCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-patch.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.before.webfetch': createHandler({
    title: '====WEBFETCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-webfetch.sh',
    props: { 'Session Id': SESSION_ID, URL: 'properties.tool.input' },
  }),

  'tool.execute.after.webfetch': createHandler({
    title: '====WEBFETCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-webfetch.sh',
    props: { 'Session Id': SESSION_ID, URL: 'properties.tool.input' },
  }),

  'tool.execute.before.websearch': createHandler({
    title: '====WEBSEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-websearch.sh',
    props: { 'Session Id': SESSION_ID, Query: 'properties.tool.input' },
  }),

  'tool.execute.after.websearch': createHandler({
    title: '====WEBSEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-websearch.sh',
    props: { 'Session Id': SESSION_ID, Query: 'properties.tool.input' },
  }),

  'tool.execute.before.codesearch': createHandler({
    title: '====CODESEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-codesearch.sh',
    props: { 'Session Id': SESSION_ID, Query: 'properties.tool.input' },
  }),

  'tool.execute.after.codesearch': createHandler({
    title: '====CODESEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-codesearch.sh',
    props: { 'Session Id': SESSION_ID, Query: 'properties.tool.input' },
  }),

  'tool.execute.before.todowrite': createHandler({
    title: '====TODOWRITE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-todowrite.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool.execute.after.todowrite': createHandler({
    title: '====TODOWRITE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-todowrite.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool.execute.before.todoread': createHandler({
    title: '====TODOREAD BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-todoread.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool.execute.after.todoread': createHandler({
    title: '====TODOREAD AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-todoread.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool.execute.before.question': createHandler({
    title: '====QUESTION BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-question.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool.execute.after.question': createHandler({
    title: '====QUESTION AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-question.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool.execute.before.git-commit': createHandler({
    title: '====GIT-COMMIT BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-git-commit.sh',
    props: { 'Session Id': SESSION_ID, Message: 'properties.tool.input' },
  }),

  'tool.execute.after.git-commit': createHandler({
    title: '====GIT-COMMIT AFTER====',
    variant: 'success',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-git-commit.sh',
    props: { 'Session Id': SESSION_ID, Message: 'properties.tool.input' },
  }),

  'tool.execute.before.filesystem_read_file': createHandler({
    title: '====FS-READ BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-read.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.after.filesystem_read_file': createHandler({
    title: '====FS-READ AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-read.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.before.filesystem_write_file': createHandler({
    title: '====FS-WRITE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-write.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.after.filesystem_write_file': createHandler({
    title: '====FS-WRITE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-write.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.before.filesystem_list_directory': createHandler({
    title: '====FS-LIST BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-list.sh',
    props: { 'Session Id': SESSION_ID, Directory: 'properties.path' },
  }),

  'tool.execute.after.filesystem_list_directory': createHandler({
    title: '====FS-LIST AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-list.sh',
    props: { 'Session Id': SESSION_ID, Directory: 'properties.path' },
  }),

  'tool.execute.before.filesystem_search_files': createHandler({
    title: '====FS-SEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-search.sh',
    props: { 'Session Id': SESSION_ID, Pattern: 'properties.pattern' },
  }),

  'tool.execute.after.filesystem_search_files': createHandler({
    title: '====FS-SEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-search.sh',
    props: { 'Session Id': SESSION_ID, Pattern: 'properties.pattern' },
  }),

  'tool.execute.before.filesystem_create_directory': createHandler({
    title: '====FS-MKDIR BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-mkdir.sh',
    props: { 'Session Id': SESSION_ID, Directory: 'properties.path' },
  }),

  'tool.execute.after.filesystem_create_directory': createHandler({
    title: '====FS-MKDIR AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-mkdir.sh',
    props: { 'Session Id': SESSION_ID, Directory: 'properties.path' },
  }),

  'tool.execute.before.filesystem_move_file': createHandler({
    title: '====FS-MOVE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-move.sh',
    props: {
      'Session Id': SESSION_ID,
      From: 'properties.source',
      To: 'properties.destination',
    },
  }),

  'tool.execute.after.filesystem_move_file': createHandler({
    title: '====FS-MOVE AFTER====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-move.sh',
    props: {
      'Session Id': SESSION_ID,
      From: 'properties.source',
      To: 'properties.destination',
    },
  }),

  'tool.execute.before.filesystem_get_file_info': createHandler({
    title: '====FS-STAT BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-stat.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.after.filesystem_get_file_info': createHandler({
    title: '====FS-STAT AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-stat.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool.execute.before.gh_grep_searchGitHub': createHandler({
    title: '====GH-SEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-before-gh-search.sh',
    props: { 'Session Id': SESSION_ID, Query: 'properties.tool.input' },
  }),

  'tool.execute.after.gh_grep_searchGitHub': createHandler({
    title: '====GH-SEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-gh-search.sh',
    props: { 'Session Id': SESSION_ID, Query: 'properties.tool.input' },
  }),
};
