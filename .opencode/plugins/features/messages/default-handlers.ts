import { TOAST_DURATION } from '../../core/constants';
import { buildKeysMessage, buildKeysMessageSimple } from '../message-formatter';

import type { EventHandler } from '../../types/events';

type BuildMessageFn = (
  event: Record<string, unknown>,
  allowedFields?: string[]
) => string;

interface HandlerConfig {
  title: string;
  variant: EventHandler['variant'];
  duration: number;
  defaultScript: string;
  buildMessage: BuildMessageFn;
  allowedFields?: string[];
  defaultTemplate?: string;
}

const createHandler = (config: HandlerConfig): EventHandler => ({
  title: config.title,
  variant: config.variant,
  duration: config.duration,
  defaultScript: config.defaultScript,
  buildMessage: config.buildMessage,
  allowedFields: config.allowedFields,
  defaultTemplate: config.defaultTemplate,
});

export const handlers: Record<string, EventHandler> = {
  'session.created': createHandler({
    title: '====SESSION CREATED====',
    variant: 'success',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'session-created.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['info.id', 'info.title', 'info.directory', 'info.parentID'],
    defaultTemplate:
      '[{timestamp}] Session: {info.id} | Project: {info.directory}',
  }),

  'session.compacted': createHandler({
    title: '====SESSION COMPACTED====',
    variant: 'info',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'session-compacted.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['sessionID', 'contextSize'],
    defaultTemplate: '[{timestamp}] Session compacted: {properties.sessionID}',
  }),

  'session.deleted': createHandler({
    title: '====SESSION DELETED====',
    variant: 'error',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-deleted.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['info.id'],
  }),

  'session.error': createHandler({
    title: '====SESSION ERROR====',
    variant: 'error',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'session-error.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['sessionID', 'error.name', 'error.data.message'],
    defaultTemplate: '[{timestamp}] ERROR: {error.name} - {error.data.message}',
  }),

  'session.diff': createHandler({
    title: '====SESSION DIFF====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-diff.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'session.idle': createHandler({
    title: '====IDLE SESSION====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-idle.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'session.status': createHandler({
    title: '====SESSION STATUS====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-status.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'session.updated': createHandler({
    title: '====UPDATED SESSION====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'message.part.removed': createHandler({
    title: '====MESSAGE PART REMOVED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-part-removed.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'message.part.updated': createHandler({
    title: '====MESSAGE PART UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-part-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'message.part.delta': createHandler({
    title: '====MESSAGE PART DELTA====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-part-delta.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'message.removed': createHandler({
    title: '====MESSAGE REMOVED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-removed.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'message.updated': createHandler({
    title: '====MESSAGE UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'message-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'tool.execute.before': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.sh',
    buildMessage: buildKeysMessage,
    allowedFields: [
      'tool',
      'args.command',
      'args.filePath',
      'args.description',
    ],
  }),

  'tool.execute.after': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.sh',
    buildMessage: buildKeysMessage,
    allowedFields: [
      'tool',
      'output.title',
      'metadata.exit',
      'metadata.description',
    ],
    defaultTemplate: '[{timestamp}] {input.tool} → {output.metadata.exit}',
  }),

  'tool.execute.after.subagent': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.subagent.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'subagentType', 'output.title'],
    defaultTemplate: '[{timestamp}] Subagent: {input.subagentType}',
  }),

  'file.edited': createHandler({
    title: '====FILE EDITED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'file-edited.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['path'],
  }),

  'file.watcher.updated': createHandler({
    title: '====FILE WATCHER UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'file-watcher-updated.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['path'],
  }),

  'permission.ask': createHandler({
    title: '====PERMISSION ASK====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'permission-ask.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['sessionID', 'tool', 'type', 'pattern', 'title'],
  }),

  'permission.updated': createHandler({
    title: '====PERMISSION UPDATED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'permission-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'permission.replied': createHandler({
    title: '====PERMISSION REPLIED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'permission-replied.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'server.connected': createHandler({
    title: '====SERVER CONNECTED====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'server-connected.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'server.instance.disposed': createHandler({
    title: '====SERVER INSTANCE DISPOSED====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-stop.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'command.executed': createHandler({
    title: '====COMMAND EXECUTED====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'command-executed.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'lsp.client.diagnostics': createHandler({
    title: '====LSP DIAGNOSTICS====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'lsp-client-diagnostics.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'lsp.updated': createHandler({
    title: '====LSP UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'lsp-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'installation.updated': createHandler({
    title: '====INSTALLATION UPDATED====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'installation-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'todo.updated': createHandler({
    title: '====TODO UPDATED====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'todo-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'shell.env': createHandler({
    title: '====SHELL ENV====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'shell-env.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['cwd', 'sessionID'],
  }),

  'tui.prompt.append': createHandler({
    title: '====TUI PROMPT APPEND====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tui-prompt-append.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'tui.command.execute': createHandler({
    title: '====TUI COMMAND EXECUTE====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tui-command-execute.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'tui.toast.show': createHandler({
    title: '====TUI TOAST SHOW====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tui-toast-show.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'experimental.session.compacting': createHandler({
    title: '====SESSION COMPACTING====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'experimental-session-compacting.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['sessionID'],
  }),

  'chat.message': createHandler({
    title: '====CHAT MESSAGE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'chat-message.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'chat.params': createHandler({
    title: '====CHAT PARAMS====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'chat-params.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'chat.headers': createHandler({
    title: '====CHAT HEADERS====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'chat-headers.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'command.execute.before': createHandler({
    title: '====COMMAND EXECUTE BEFORE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'command-execute-before.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'experimental.chat.messages.transform': createHandler({
    title: '====CHAT MESSAGES TRANSFORM====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'experimental-chat-messages-transform.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'experimental.chat.system.transform': createHandler({
    title: '====CHAT SYSTEM TRANSFORM====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'experimental-chat-system-transform.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'experimental.text.complete': createHandler({
    title: '====TEXT COMPLETE====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'experimental-text-complete.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'tool.definition': createHandler({
    title: '====TOOL DEFINITION====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-definition.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'tool.execute.before.task': createHandler({
    title: '====TASK BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-before-task.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.task': createHandler({
    title: '====TASK AFTER====',
    variant: 'success',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-after-task.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.skill': createHandler({
    title: '====SKILL BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-before-skill.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.skill': createHandler({
    title: '====SKILL AFTER====',
    variant: 'success',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'tool-execute-after-skill.sh',
    buildMessage: buildKeysMessage,
    defaultTemplate: '[{timestamp}] Skill: {input.args.name}',
  }),

  'tool.execute.before.bash': createHandler({
    title: '====BASH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-bash.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.bash': createHandler({
    title: '====BASH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-bash.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.write': createHandler({
    title: '====WRITE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-write.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.write': createHandler({
    title: '====WRITE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-write.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.edit': createHandler({
    title: '====EDIT BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-edit.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.edit': createHandler({
    title: '====EDIT AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-edit.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.read': createHandler({
    title: '====READ BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-read.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.read': createHandler({
    title: '====READ AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-read.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.glob': createHandler({
    title: '====GLOB BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-glob.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.glob': createHandler({
    title: '====GLOB AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-glob.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.grep': createHandler({
    title: '====GREP BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-grep.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.grep': createHandler({
    title: '====GREP AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-grep.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.list': createHandler({
    title: '====LIST BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-list.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.list': createHandler({
    title: '====LIST AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-list.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.patch': createHandler({
    title: '====PATCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-patch.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.patch': createHandler({
    title: '====PATCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-patch.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.webfetch': createHandler({
    title: '====WEBFETCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-webfetch.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.webfetch': createHandler({
    title: '====WEBFETCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-webfetch.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.websearch': createHandler({
    title: '====WEBSEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-websearch.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.websearch': createHandler({
    title: '====WEBSEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-websearch.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.codesearch': createHandler({
    title: '====CODESEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-codesearch.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.codesearch': createHandler({
    title: '====CODESEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-codesearch.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.todowrite': createHandler({
    title: '====TODOWRITE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-todowrite.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.todowrite': createHandler({
    title: '====TODOWRITE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-todowrite.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.todoread': createHandler({
    title: '====TODOREAD BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-todoread.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.todoread': createHandler({
    title: '====TODOREAD AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-todoread.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.question': createHandler({
    title: '====QUESTION BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-question.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.question': createHandler({
    title: '====QUESTION AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-question.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.git-commit': createHandler({
    title: '====GIT-COMMIT BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-git-commit.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.git-commit': createHandler({
    title: '====GIT-COMMIT AFTER====',
    variant: 'success',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-git-commit.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.filesystem_read_file': createHandler({
    title: '====FS-READ BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-read.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.filesystem_read_file': createHandler({
    title: '====FS-READ AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-read.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.filesystem_write_file': createHandler({
    title: '====FS-WRITE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-write.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.filesystem_write_file': createHandler({
    title: '====FS-WRITE AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-write.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.filesystem_list_directory': createHandler({
    title: '====FS-LIST BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-list.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.filesystem_list_directory': createHandler({
    title: '====FS-LIST AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-list.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.filesystem_search_files': createHandler({
    title: '====FS-SEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-search.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.filesystem_search_files': createHandler({
    title: '====FS-SEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-search.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.filesystem_create_directory': createHandler({
    title: '====FS-MKDIR BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-mkdir.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.filesystem_create_directory': createHandler({
    title: '====FS-MKDIR AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-mkdir.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.filesystem_move_file': createHandler({
    title: '====FS-MOVE BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-move.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.filesystem_move_file': createHandler({
    title: '====FS-MOVE AFTER====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-move.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.filesystem_get_file_info': createHandler({
    title: '====FS-STAT BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-filesystem-stat.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.filesystem_get_file_info': createHandler({
    title: '====FS-STAT AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-filesystem-stat.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.before.gh_grep_searchGitHub': createHandler({
    title: '====GH-SEARCH BEFORE====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-before-gh-search.sh',
    buildMessage: buildKeysMessage,
  }),

  'tool.execute.after.gh_grep_searchGitHub': createHandler({
    title: '====GH-SEARCH AFTER====',
    variant: 'info',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'tool-execute-after-gh-search.sh',
    buildMessage: buildKeysMessage,
  }),

  'session.unknown': createHandler({
    title: '====UNKNOWN SESSION EVENT====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'session-unknown.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'unknown.event': createHandler({
    title: '====UNKNOWN EVENT====',
    variant: 'warning',
    duration: TOAST_DURATION.FIVE_SECONDS,
    defaultScript: 'unknown-event.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};
