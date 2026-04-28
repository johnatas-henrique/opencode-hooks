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

export const messageHandlers: Record<string, EventHandler> = {
  'message.part.removed': createHandler({
    title: '====MESSAGE PART REMOVED====',
    variant: 'warning',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'message-part-removed.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'message.part.updated': createHandler({
    title: '====MESSAGE PART UPDATED====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'message-part-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'message.part.delta': createHandler({
    title: '====MESSAGE PART DELTA====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'message-part-delta.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'message.removed': createHandler({
    title: '====MESSAGE REMOVED====',
    variant: 'warning',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'message-removed.sh',
    buildMessage: buildKeysMessageSimple,
  }),

  'message.updated': createHandler({
    title: '====MESSAGE UPDATED====',
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: 'message-updated.sh',
    buildMessage: buildKeysMessageSimple,
  }),
};
