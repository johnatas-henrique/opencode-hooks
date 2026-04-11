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
        `Diagnostics: ${diagnostics ? diagnostics.length : 0}\n` +
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

  'tool:task': createHandler({
    title: '====SUBAGENT====',
    variant: 'success',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-task.sh',
    props: { 'Session Id': SESSION_ID, 'Subagent Id': 'properties.sessionID' },
  }),

  'tool:skill': createHandler({
    title: '====SKILL====',
    variant: 'success',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-skill.sh',
    props: { 'Session Id': SESSION_ID, 'Skill Id': 'properties.tool.input' },
  }),

  'tool:bash': createHandler({
    title: '====TERMINAL COMMAND====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-bash.sh',
    props: { 'Session Id': SESSION_ID, Command: 'properties.tool.input' },
  }),

  'tool:write': createHandler({
    title: '====FILE WRITE====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-write.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool:edit': createHandler({
    title: '====FILE EDIT====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-edit.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool:chat': createHandler({
    title: '====CHAT====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-chat.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool:read': createHandler({
    title: '====FILE READ====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-read.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool:glob': createHandler({
    title: '====FILE SEARCH====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-glob.sh',
    props: { 'Session Id': SESSION_ID, Pattern: 'properties.tool.input' },
  }),

  'tool:grep': createHandler({
    title: '====TEXT SEARCH====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-grep.sh',
    props: { 'Session Id': SESSION_ID, Pattern: 'properties.tool.input' },
  }),

  'tool:list': createHandler({
    title: '====DIRECTORY LIST====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-list.sh',
    props: { 'Session Id': SESSION_ID, Directory: 'properties.path' },
  }),

  'tool:patch': createHandler({
    title: '====PATCH====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-patch.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool:webfetch': createHandler({
    title: '====WEB FETCH====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-webfetch.sh',
    props: { 'Session Id': SESSION_ID, URL: 'properties.tool.input' },
  }),

  'tool:websearch': createHandler({
    title: '====WEB SEARCH====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-websearch.sh',
    props: { 'Session Id': SESSION_ID, Query: 'properties.tool.input' },
  }),

  'tool:codesearch': createHandler({
    title: '====CODE SEARCH====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-codesearch.sh',
    props: { 'Session Id': SESSION_ID, Query: 'properties.tool.input' },
  }),

  'tool:todowrite': createHandler({
    title: '====TODO WRITE====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-todowrite.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool:todoread': createHandler({
    title: '====TODO READ====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-todoread.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool:question': createHandler({
    title: '====QUESTION====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-question.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool:git.commit': createHandler({
    title: '====GIT COMMIT====',
    variant: 'success',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-git-commit.sh',
    props: { 'Session Id': SESSION_ID, Message: 'properties.tool.input' },
  }),

  'tool:git.push': createHandler({
    title: '====GIT PUSH====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-git-push.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool:git.pull': createHandler({
    title: '====GIT PULL====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-git-pull.sh',
    props: { 'Session Id': SESSION_ID },
  }),

  'tool:filesystem_read_file': createHandler({
    title: '====FS READ====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-filesystem-read.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool:filesystem_write_file': createHandler({
    title: '====FS WRITE====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-filesystem-write.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool:filesystem_list_directory': createHandler({
    title: '====FS LIST====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-filesystem-list.sh',
    props: { 'Session Id': SESSION_ID, Directory: 'properties.path' },
  }),

  'tool:filesystem_search_files': createHandler({
    title: '====FS SEARCH====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-filesystem-search.sh',
    props: { 'Session Id': SESSION_ID, Pattern: 'properties.pattern' },
  }),

  'tool:filesystem_create_directory': createHandler({
    title: '====FS MKDIR====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-filesystem-mkdir.sh',
    props: { 'Session Id': SESSION_ID, Directory: 'properties.path' },
  }),

  'tool:filesystem_move_file': createHandler({
    title: '====FS MOVE====',
    variant: 'warning',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-filesystem-move.sh',
    props: {
      'Session Id': SESSION_ID,
      From: 'properties.source',
      To: 'properties.destination',
    },
  }),

  'tool:filesystem_get_file_info': createHandler({
    title: '====FS STAT====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-filesystem-stat.sh',
    props: { 'Session Id': SESSION_ID, File: 'properties.path' },
  }),

  'tool:gh_grep_searchGitHub': createHandler({
    title: '====GH SEARCH====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-gh-search.sh',
    props: { 'Session Id': SESSION_ID, Query: 'properties.tool.input' },
  }),
};
