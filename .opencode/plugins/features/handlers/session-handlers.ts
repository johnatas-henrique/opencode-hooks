import { DEFAULTS } from '.opencode/plugins/core/constants';
import { buildKeysMessageSimple } from '.opencode/plugins/features/message-formatter/build-keys-message';
import type { EventHandler } from '.opencode/plugins/types/events';
import { createHandler } from '.opencode/plugins/features/handlers/create-handler';

const sessionNextHandler: EventHandler = {
  title: '',
  variant: 'info',
  duration: DEFAULTS.toast.durations.FIVE_SECONDS,
  defaultScript: '',
  buildMessage: buildKeysMessageSimple,
};

export const sessionHandlers: Record<string, EventHandler> = {
  'session.created': createHandler({
    title: '====SESSION CREATED====',
    variant: 'success',
    duration: DEFAULTS.toast.durations.TEN_SECONDS,
    defaultScript: 'session-created.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['info.id', 'info.title', 'info.directory', 'info.parentID'],
    defaultTemplate:
      '[{timestamp}] Session: {info.id} | Project: {info.directory}',
  }),

  'session.compacted': createHandler({
    title: '====SESSION COMPACTED====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.TEN_SECONDS,
    defaultScript: 'session-compacted.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['sessionID', 'contextSize'],
    defaultTemplate: '[{timestamp}] Session compacted: {properties.sessionID}',
  }),

  'session.deleted': createHandler({
    title: '====SESSION DELETED====',
    variant: 'error',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'session-deleted.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['info.id'],
  }),

  'session.error': createHandler({
    title: '====SESSION ERROR====',
    variant: 'error',
    duration: DEFAULTS.toast.durations.TEN_SECONDS,
    defaultScript: 'session-error.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['sessionID', 'error.name', 'error.data.message'],
    defaultTemplate: '[{timestamp}] ERROR: {error.name} - {error.data.message}',
  }),

  'session.diff': createHandler({
    title: '====SESSION DIFF====',
    variant: 'warning',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'session-diff.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'session.idle': createHandler({
    title: '====IDLE SESSION====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'session-idle.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'session.status': createHandler({
    title: '====SESSION STATUS====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'session-status.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'session.updated': createHandler({
    title: '====UPDATED SESSION====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'session-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'session.unknown': createHandler({
    title: '====UNKNOWN SESSION EVENT====',
    variant: 'warning',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'session-unknown.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'session.next.agent.switched': sessionNextHandler,
  'session.next.model.switched': sessionNextHandler,
  'session.next.prompted': sessionNextHandler,
  'session.next.synthetic': sessionNextHandler,
  'session.next.shell.started': sessionNextHandler,
  'session.next.shell.ended': sessionNextHandler,
  'session.next.step.started': sessionNextHandler,
  'session.next.step.ended': sessionNextHandler,
  'session.next.step.failed': sessionNextHandler,
  'session.next.text.started': sessionNextHandler,
  'session.next.text.delta': sessionNextHandler,
  'session.next.text.ended': sessionNextHandler,
  'session.next.reasoning.started': sessionNextHandler,
  'session.next.reasoning.delta': sessionNextHandler,
  'session.next.reasoning.ended': sessionNextHandler,
  'session.next.tool.input.started': sessionNextHandler,
  'session.next.tool.input.delta': sessionNextHandler,
  'session.next.tool.input.ended': sessionNextHandler,
  'session.next.tool.called': sessionNextHandler,
  'session.next.tool.progress': sessionNextHandler,
  'session.next.tool.success': sessionNextHandler,
  'session.next.tool.failed': sessionNextHandler,
  'session.next.retried': sessionNextHandler,
  'session.next.compaction.started': sessionNextHandler,
  'session.next.compaction.delta': sessionNextHandler,
  'session.next.compaction.ended': sessionNextHandler,
};
