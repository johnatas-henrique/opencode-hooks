import { DEFAULTS } from '.opencode/plugins/core/constants';
import { buildKeysMessageSimple } from '.opencode/plugins/features/message-formatter/build-keys-message';
import type { EventHandler } from '.opencode/plugins/types/events';
import { createHandler } from '.opencode/plugins/features/handlers/create-handler';

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
