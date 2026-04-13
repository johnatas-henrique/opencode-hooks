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

const TRUNCATE_LENGTH = 1000;

const SENSITIVE_PATTERNS = [
  [/(api[_-]?key)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(token)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(secret)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(password)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(credential)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(bearer)\s+[\w-]+/gi, '$1'],
  [/(gh[pousr]_[a-zA-Z0-9]{36,})/gi, '$1'],
];

const maskSensitive = (str: string): string => {
  let result = str;
  for (const [pattern, group] of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, `${group}: [REDACTED]`);
  }
  return result;
};

const truncate = (str: string): string => {
  if (str.length > TRUNCATE_LENGTH) {
    return str.slice(0, TRUNCATE_LENGTH) + '...';
  }
  return str;
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'unknown';
  }
  const str = JSON.stringify(value);
  return truncate(maskSensitive(str));
};

export const buildAllKeysMessage = (event: Record<string, unknown>): string => {
  const lines: string[] = [];

  if (event.input) {
    const input = event.input as Record<string, unknown>;
    for (const [key, value] of Object.entries(input)) {
      if (key === 'args') {
        const args = value as Record<string, unknown>;
        for (const [argKey, argValue] of Object.entries(args ?? {})) {
          lines.push(`input.args.${argKey}: ${formatValue(argValue)}`);
        }
      } else {
        lines.push(`input.${key}: ${formatValue(value)}`);
      }
    }
  }

  if (event.output) {
    const output = event.output as Record<string, unknown>;
    for (const [key, value] of Object.entries(output)) {
      lines.push(`output.${key}: ${formatValue(value)}`);
    }
  }

  if (event.properties && !event.input) {
    const props = event.properties as Record<string, unknown>;
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'object' && value !== null) {
        lines.push(`${key}: ${formatValue(value)}`);
        for (const [nestedKey, nestedValue] of Object.entries(
          value as Record<string, unknown>
        )) {
          lines.push(`  ${nestedKey}: ${formatValue(nestedValue)}`);
        }
      } else {
        lines.push(`${key}: ${formatValue(value)}`);
      }
    }
  }

  lines.push(`Time: ${formatTime()}`);
  return lines.join('\n');
};

export const buildAllKeysMessageSimple = (
  event: Record<string, unknown>
): string => {
  const lines: string[] = [];

  const flatten = (obj: Record<string, unknown>, prefix = ''): void => {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        flatten(value as Record<string, unknown>, fullKey);
      } else {
        lines.push(`${fullKey}: ${formatValue(value)}`);
      }
    }
  };

  if (event.properties) {
    flatten(event.properties as Record<string, unknown>);
  }

  lines.push(`Time: ${formatTime()}`);
  return lines.join('\n');
};

interface HandlerConfig {
  title: string;
  variant: EventHandler['variant'];
  duration: number;
  defaultScript: string;
  buildMessage: BuildMessageFn;
}

const createHandler = (config: HandlerConfig): EventHandler => ({
  title: config.title,
  variant: config.variant,
  duration: config.duration,
  defaultScript: config.defaultScript,
  buildMessage: config.buildMessage,
});

export const handlers: Record<string, EventHandler> = {
  'session.created': createHandler({
    title: '====SESSION CREATED====',
    variant: 'success',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'session-created.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'session.compacted': createHandler({
    title: '====SESSION COMPACTED====',
    variant: 'info',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'session-compacted.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'session.deleted': createHandler({
    title: '====SESSION DELETED====',
    variant: 'error',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-deleted.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'session.error': createHandler({
    title: '====SESSION ERROR====',
    variant: 'error',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'session-error.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'session.diff': createHandler({
    title: '====SESSION DIFF====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-diff.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'session.idle': createHandler({
    title: '====IDLE SESSION====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-idle.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'session.status': createHandler({
    title: '====SESSION STATUS====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-status.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'session.updated': createHandler({
    title: '====UPDATED SESSION====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-updated.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'message.part.removed': createHandler({
    title: '====MESSAGE PART REMOVED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-part-removed.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'message.part.updated': createHandler({
    title: '====MESSAGE PART UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-part-updated.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'message.part.delta': createHandler({
    title: '====MESSAGE PART DELTA====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-part-delta.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'message.removed': createHandler({
    title: '====MESSAGE REMOVED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-removed.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'message.updated': createHandler({
    title: '====MESSAGE UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-updated.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'tool.execute.before': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.subagent': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.subagent.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'file.edited': createHandler({
    title: '====FILE EDITED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'file-edited.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'file.watcher.updated': createHandler({
    title: '====FILE WATCHER UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'file-watcher-updated.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'permission.ask': createHandler({
    title: '====PERMISSION ASK====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'permission-ask.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'permission.updated': createHandler({
    title: '====PERMISSION UPDATED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'permission-updated.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'permission.replied': createHandler({
    title: '====PERMISSION REPLIED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'permission-replied.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'server.connected': createHandler({
    title: '====SERVER CONNECTED====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'server-connected.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'server.instance.disposed': createHandler({
    title: '====SERVER INSTANCE DISPOSED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-stop.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'command.executed': createHandler({
    title: '====COMMAND EXECUTED====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'command-executed.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'lsp.client.diagnostics': createHandler({
    title: '====LSP DIAGNOSTICS====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'lsp-client-diagnostics.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'lsp.updated': createHandler({
    title: '====LSP UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'lsp-updated.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'installation.updated': createHandler({
    title: '====INSTALLATION UPDATED====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'installation-updated.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'todo.updated': createHandler({
    title: '====TODO UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'todo-updated.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'shell.env': createHandler({
    title: '====SHELL ENV====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'shell-env.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tui.prompt.append': createHandler({
    title: '====TUI PROMPT APPEND====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tui-prompt-append.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'tui.command.execute': createHandler({
    title: '====TUI COMMAND EXECUTE====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tui-command-execute.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'tui.toast.show': createHandler({
    title: '====TUI TOAST SHOW====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tui-toast-show.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'experimental.session.compacting': createHandler({
    title: '====SESSION COMPACTING====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'experimental-session-compacting.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'chat.message': createHandler({
    title: '====CHAT MESSAGE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'chat-message.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'chat.params': createHandler({
    title: '====CHAT PARAMS====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'chat-params.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'chat.headers': createHandler({
    title: '====CHAT HEADERS====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'chat-headers.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'command.execute.before': createHandler({
    title: '====COMMAND EXECUTE BEFORE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'command-execute-before.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'experimental.chat.messages.transform': createHandler({
    title: '====CHAT MESSAGES TRANSFORM====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'experimental-chat-messages-transform.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'experimental.chat.system.transform': createHandler({
    title: '====CHAT SYSTEM TRANSFORM====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'experimental-chat-system-transform.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'experimental.text.complete': createHandler({
    title: '====TEXT COMPLETE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'experimental-text-complete.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'tool.definition': createHandler({
    title: '====TOOL DEFINITION====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-definition.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'tool.execute.before.task': createHandler({
    title: '====TASK BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-before-task.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.task': createHandler({
    title: '====TASK AFTER====',
    variant: 'success',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-after-task.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.skill': createHandler({
    title: '====SKILL BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-before-skill.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.skill': createHandler({
    title: '====SKILL AFTER====',
    variant: 'success',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-after-skill.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.bash': createHandler({
    title: '====BASH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-bash.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.bash': createHandler({
    title: '====BASH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-bash.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.write': createHandler({
    title: '====WRITE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-write.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.write': createHandler({
    title: '====WRITE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-write.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.edit': createHandler({
    title: '====EDIT BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-edit.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.edit': createHandler({
    title: '====EDIT AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-edit.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.read': createHandler({
    title: '====READ BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-read.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.read': createHandler({
    title: '====READ AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-read.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.glob': createHandler({
    title: '====GLOB BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-glob.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.glob': createHandler({
    title: '====GLOB AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-glob.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.grep': createHandler({
    title: '====GREP BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-grep.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.grep': createHandler({
    title: '====GREP AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-grep.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.list': createHandler({
    title: '====LIST BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-list.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.list': createHandler({
    title: '====LIST AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-list.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.patch': createHandler({
    title: '====PATCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-patch.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.patch': createHandler({
    title: '====PATCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-patch.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.webfetch': createHandler({
    title: '====WEBFETCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-webfetch.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.webfetch': createHandler({
    title: '====WEBFETCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-webfetch.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.websearch': createHandler({
    title: '====WEBSEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-websearch.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.websearch': createHandler({
    title: '====WEBSEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-websearch.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.codesearch': createHandler({
    title: '====CODESEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-codesearch.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.codesearch': createHandler({
    title: '====CODESEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-codesearch.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.todowrite': createHandler({
    title: '====TODOWRITE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-todowrite.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.todowrite': createHandler({
    title: '====TODOWRITE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-todowrite.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.todoread': createHandler({
    title: '====TODOREAD BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-todoread.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.todoread': createHandler({
    title: '====TODOREAD AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-todoread.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.question': createHandler({
    title: '====QUESTION BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-question.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.question': createHandler({
    title: '====QUESTION AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-question.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.git-commit': createHandler({
    title: '====GIT-COMMIT BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-git-commit.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.git-commit': createHandler({
    title: '====GIT-COMMIT AFTER====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-git-commit.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.filesystem_read_file': createHandler({
    title: '====FS-READ BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-read.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.filesystem_read_file': createHandler({
    title: '====FS-READ AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-read.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.filesystem_write_file': createHandler({
    title: '====FS-WRITE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-write.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.filesystem_write_file': createHandler({
    title: '====FS-WRITE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-write.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.filesystem_list_directory': createHandler({
    title: '====FS-LIST BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-list.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.filesystem_list_directory': createHandler({
    title: '====FS-LIST AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-list.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.filesystem_search_files': createHandler({
    title: '====FS-SEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-search.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.filesystem_search_files': createHandler({
    title: '====FS-SEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-search.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.filesystem_create_directory': createHandler({
    title: '====FS-MKDIR BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-mkdir.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.filesystem_create_directory': createHandler({
    title: '====FS-MKDIR AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-mkdir.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.filesystem_move_file': createHandler({
    title: '====FS-MOVE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-move.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.filesystem_move_file': createHandler({
    title: '====FS-MOVE AFTER====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-move.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.filesystem_get_file_info': createHandler({
    title: '====FS-STAT BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-stat.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.filesystem_get_file_info': createHandler({
    title: '====FS-STAT AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-stat.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.before.gh_grep_searchGitHub': createHandler({
    title: '====GH-SEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-gh-search.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'tool.execute.after.gh_grep_searchGitHub': createHandler({
    title: '====GH-SEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-gh-search.sh',
    buildMessage: buildAllKeysMessage,
  }),

  'session.unknown': createHandler({
    title: '====UNKNOWN SESSION EVENT====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-unknown.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),

  'unknown.event': createHandler({
    title: '====UNKNOWN EVENT====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'unknown-event.sh',
    buildMessage: buildAllKeysMessageSimple,
  }),
};
