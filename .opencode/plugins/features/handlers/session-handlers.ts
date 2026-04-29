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
};
