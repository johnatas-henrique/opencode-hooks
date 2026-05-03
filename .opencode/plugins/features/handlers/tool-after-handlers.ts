import { DEFAULTS } from '.opencode/plugins/core/constants';
import { buildKeysMessage } from '.opencode/plugins/features/message-formatter/build-keys-message';
import type { EventHandler } from '.opencode/plugins/types/events';
import type { HandlerConfig } from '.opencode/plugins/types/messages';

const createHandler = (config: HandlerConfig): EventHandler => ({
  title: config.title,
  variant: config.variant,
  duration: config.duration,
  defaultScript: config.defaultScript,
  buildMessage: config.buildMessage,
  allowedFields: config.allowedFields,
  defaultTemplate: config.defaultTemplate,
});

export const toolAfterHandlers: Record<string, EventHandler> = {
  'tool.execute.after.bash': createHandler({
    title: '====BASH AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.bash.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'output.title', 'metadata.exit'],
  }),

  'tool.execute.after.codesearch': createHandler({
    title: '====CODE SEARCH AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.codesearch.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.edit': createHandler({
    title: '====EDIT AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.edit.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.filesystem_create_directory': createHandler({
    title: '====FS MKDIR AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_create_directory.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.filesystem_get_file_info': createHandler({
    title: '====FS STAT AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_get_file_info.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.filesystem_list_directory': createHandler({
    title: '====FS LS AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_list_directory.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.filesystem_move_file': createHandler({
    title: '====FS MV AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_move_file.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.source', 'args.destination'],
  }),

  'tool.execute.after.filesystem_read_file': createHandler({
    title: '====FS READ AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_read_file.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.filesystem_search_files': createHandler({
    title: '====FS FIND AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_search_files.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.after.filesystem_write_file': createHandler({
    title: '====FS WRITE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_write_file.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.gh_grep_searchGitHub': createHandler({
    title: '====GH SEARCH AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.github_search_code.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.git-commit': createHandler({
    title: '====GIT COMMIT AFTER====',
    variant: 'success',
    duration: DEFAULTS.toast.durations.TEN_SECONDS,
    defaultScript: 'tool-execute-after.git-commit.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'output.title', 'metadata.exit'],
    defaultTemplate: '[{timestamp}] Git commit: {output.title}',
  }),

  'tool.execute.after.glob': createHandler({
    title: '====GLOB AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.glob.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.after.grep': createHandler({
    title: '====GREP AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.grep.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.after.list': createHandler({
    title: '====LIST AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.list.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.patch': createHandler({
    title: '====PATCH AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.patch.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.question': createHandler({
    title: '====QUESTION AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.question.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.read': createHandler({
    title: '====READ AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.read.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.filePath'],
  }),

  'tool.execute.after.skill': createHandler({
    title: '====SKILL AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.skill.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'output.title'],
  }),

  'tool.execute.after.task': createHandler({
    title: '====TASK AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.task.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.todoread': createHandler({
    title: '====TODO READ AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.todoread.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.todowrite': createHandler({
    title: '====TODO WRITE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.todowrite.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.webfetch': createHandler({
    title: '====WEB FETCH AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.webfetch.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.url'],
  }),

  'tool.execute.after.websearch': createHandler({
    title: '====WEB SEARCH AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.websearch.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.query'],
  }),

  'tool.execute.after.write': createHandler({
    title: '====WRITE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.write.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.filePath'],
  }),
};
