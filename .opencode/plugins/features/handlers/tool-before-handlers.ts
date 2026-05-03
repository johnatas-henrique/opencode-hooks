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

export const toolBeforeHandlers: Record<string, EventHandler> = {
  'tool.execute.before.bash': createHandler({
    title: '====BASH BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.bash.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.command'],
  }),

  'tool.execute.before.codesearch': createHandler({
    title: '====CODE SEARCH BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.codesearch.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.query'],
  }),

  'tool.execute.before.edit': createHandler({
    title: '====EDIT BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.edit.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.filesystem_create_directory': createHandler({
    title: '====FS MKDIR BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_create_directory.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.filesystem_get_file_info': createHandler({
    title: '====FS STAT BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_get_file_info.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.filesystem_list_directory': createHandler({
    title: '====FS LS BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_list_directory.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.filesystem_move_file': createHandler({
    title: '====FS MV BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_move_file.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.source', 'args.destination'],
  }),

  'tool.execute.before.filesystem_read_file': createHandler({
    title: '====FS READ BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_read_file.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.filesystem_search_files': createHandler({
    title: '====FS FIND BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_search_files.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.before.filesystem_write_file': createHandler({
    title: '====FS WRITE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_write_file.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.gh_grep_searchGitHub': createHandler({
    title: '====GH SEARCH BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.github_search_code.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.query'],
  }),

  'tool.execute.before.git-commit': createHandler({
    title: '====GIT COMMIT BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.git-commit.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.message'],
  }),

  'tool.execute.before.glob': createHandler({
    title: '====GLOB BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.glob.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.before.grep': createHandler({
    title: '====GREP BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.grep.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.before.list': createHandler({
    title: '====LIST BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.list.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool'],
  }),

  'tool.execute.before.patch': createHandler({
    title: '====PATCH BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.patch.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.question': createHandler({
    title: '====QUESTION BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.question.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.question'],
  }),

  'tool.execute.before.read': createHandler({
    title: '====READ BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.read.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.filePath'],
  }),

  'tool.execute.before.skill': createHandler({
    title: '====SKILL BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.skill.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.name'],
  }),

  'tool.execute.before.task': createHandler({
    title: '====TASK BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.task.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool'],
  }),

  'tool.execute.before.todoread': createHandler({
    title: '====TODO READ BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.todoread.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool'],
  }),

  'tool.execute.before.todowrite': createHandler({
    title: '====TODO WRITE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.todowrite.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool'],
  }),

  'tool.execute.before.webfetch': createHandler({
    title: '====WEB FETCH BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.webfetch.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.url'],
  }),

  'tool.execute.before.websearch': createHandler({
    title: '====WEB SEARCH BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.websearch.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.query'],
  }),

  'tool.execute.before.write': createHandler({
    title: '====WRITE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.write.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'args.filePath'],
  }),
};
