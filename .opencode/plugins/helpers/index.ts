import { saveToFile, type ToastCallback } from './save-to-file';
import { runScript } from './run-script';
import { appendToSession } from './append-to-session';
import {
  showToastStaggered,
  createToastQueue,
  getGlobalToastQueue,
  resetGlobalToastQueue,
} from './toast-queue';
import { handlers, type EventHandler } from './default-handlers';
import {
  resolveEventConfig,
  resolveToolConfig,
  getHandler,
  type ResolvedEventConfig,
} from './events';
import {
  EventType,
  type EventVariant,
  type EventOverride,
  type ToolOverride,
  type EventConfig,
  type ToolConfig,
  type UserEventsConfig,
} from './event-types';
import { showActivePluginsToast } from './show-active-plugins';
import {
  waitForToastSilence,
  countToastsInLog,
} from './toast-silence-detector';

export {
  saveToFile,
  runScript,
  appendToSession,
  showToastStaggered,
  createToastQueue,
  getGlobalToastQueue,
  resetGlobalToastQueue,
  handlers,
  resolveEventConfig,
  resolveToolConfig,
  getHandler,
  EventType,
  showActivePluginsToast,
  waitForToastSilence,
  countToastsInLog,
};
export type {
  EventHandler,
  ResolvedEventConfig,
  EventVariant,
  EventOverride,
  ToolOverride,
  EventConfig,
  ToolConfig,
  UserEventsConfig,
  ToastCallback,
};
