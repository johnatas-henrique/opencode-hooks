import { DEFAULTS } from '../../core/constants';
import { buildKeysMessageSimple } from '../message-formatter/build-keys-message';
import type { EventHandler } from '../../types/events';
import type { HandlerConfig } from '../../types/messages';

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
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.bash.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.command'],
  }),

  'tool.execute.before.codesearch': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.codesearch.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.query'],
  }),

  'tool.execute.before.edit': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.edit.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.filesystem_create_directory': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_create_directory.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.filesystem_get_file_info': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_get_file_info.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.filesystem_list_directory': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_list_directory.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.filesystem_move_file': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_move_file.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.source', 'args.destination'],
  }),

  'tool.execute.before.filesystem_read_file': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_read_file.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.filesystem_search_files': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_search_files.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.before.filesystem_write_file': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.filesystem_write_file.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.gh_grep_searchGitHub': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.github_search_code.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.query'],
  }),

  'tool.execute.before.git-commit': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.git-commit.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.message'],
  }),

  'tool.execute.before.glob': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.glob.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.before.grep': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.grep.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.before.list': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.list.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool'],
  }),

  'tool.execute.before.patch': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.patch.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.before.question': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.question.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.question'],
  }),

  'tool.execute.before.read': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.read.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.filePath'],
  }),

  'tool.execute.before.skill': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.skill.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.name'],
  }),

  'tool.execute.before.task': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.task.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool'],
  }),

  'tool.execute.before.todoread': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.todoread.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool'],
  }),

  'tool.execute.before.todowrite': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.todowrite.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool'],
  }),

  'tool.execute.before.webfetch': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.webfetch.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.url'],
  }),

  'tool.execute.before.websearch': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.websearch.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.query'],
  }),

  'tool.execute.before.write': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-before.write.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.filePath'],
  }),
};
