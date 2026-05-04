import { DEFAULTS } from '.opencode/plugins/core/constants';
import {
  buildKeysMessage,
  buildKeysMessageSimple,
} from '.opencode/plugins/features/message-formatter/build-keys-message';
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

export const toolHandlers: Record<string, EventHandler> = {
  'tool.execute.before': createHandler({
    title: '====TOOL EXECUTE BEFORE====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
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
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
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
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'tool-execute-after.subagent.sh',
    buildMessage: buildKeysMessage,
    allowedFields: ['tool', 'subagentType', 'output.title'],
    defaultTemplate: '[{timestamp}] Subagent: {input.subagentType}',
  }),

  'file.edited': createHandler({
    title: '====FILE EDITED====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'file-edited.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['path'],
  }),

  'file.watcher.updated': createHandler({
    title: '====FILE WATCHER UPDATED====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'file-watcher-updated.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['path'],
  }),

  'permission.asked': createHandler({
    title: '====PERMISSION ASKED====',
    variant: 'warning',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'permission-asked.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['sessionID', 'tool', 'type', 'pattern', 'title'],
  }),

  'permission.updated': createHandler({
    title: '====PERMISSION UPDATED====',
    variant: 'warning',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'permission-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'permission.replied': createHandler({
    title: '====PERMISSION REPLIED====',
    variant: 'warning',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'permission-replied.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};
