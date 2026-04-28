import { DEFAULTS } from '../../core/constants';
import {
  buildKeysMessage,
  buildKeysMessageSimple,
} from '../message-formatter/build-keys-message';
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

export const toolAfterHandlers: Record<string, EventHandler> = {
  'tool.execute.after.bash': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.bash.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'output.title', 'metadata.exit'],
  }),

  'tool.execute.after.codesearch': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.codesearch.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.edit': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.edit.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.filesystem_create_directory': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_create_directory.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.filesystem_get_file_info': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_get_file_info.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.filesystem_list_directory': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_list_directory.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.filesystem_move_file': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_move_file.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.source', 'args.destination'],
  }),

  'tool.execute.after.filesystem_read_file': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_read_file.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.filesystem_search_files': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_search_files.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.after.filesystem_write_file': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.filesystem_write_file.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.gh_grep_searchGitHub': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.github_search_code.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.git-commit': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'success',
    duration: DEFAULTS.toast.durations.TEN_SECONDS,
    defaultScript: 'tool-execute-after.git-commit.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'output.title', 'metadata.exit'],
    defaultTemplate: '[{timestamp}] Git commit: {output.title}',
  }),

  'tool.execute.after.glob': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.glob.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.after.grep': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.grep.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.pattern'],
  }),

  'tool.execute.after.list': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.list.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.patch': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.patch.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.path'],
  }),

  'tool.execute.after.question': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.question.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.read': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.read.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.filePath'],
  }),

  'tool.execute.after.skill': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.skill.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'output.title'],
  }),

  'tool.execute.after.task': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.task.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.todoread': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.todoread.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.todowrite': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.todowrite.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool'],
  }),

  'tool.execute.after.webfetch': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.webfetch.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.url'],
  }),

  'tool.execute.after.websearch': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.websearch.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.query'],
  }),

  'tool.execute.after.write': createHandler({
    title: '====TOOL EXECUTE AFTER====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.write.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['tool', 'args.filePath'],
  }),
};
