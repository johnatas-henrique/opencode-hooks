import { saveToFile, type ToastCallback } from './save-to-file';
import { runScript } from './run-script';
import { runScriptAndHandle } from './run-script-handler';
import { appendToSession } from './append-to-session';
import { handleDebugLog } from './debug';
import {
  showToastStaggered,
  createToastQueue,
  initGlobalToastQueue,
  useGlobalToastQueue,
  getGlobalToastQueue,
  resetGlobalToastQueue,
  type ToastQueue,
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
} from './config';
import { showActivePluginsToast } from './show-active-plugins';
import {
  waitForToastSilence,
  countToastsInLog,
} from './toast-silence-detector';
import { showStartupToast } from './show-startup-toast';
import { logEventConfig, logScriptOutput } from './log-event';
import {
  isPrimarySession as isSessionPrimary,
  getPrimarySessionId,
  resetSessionTracking,
} from './session';
import type { RunScriptConfig } from './script-config';

export {
  saveToFile,
  runScript,
  runScriptAndHandle,
  appendToSession,
  handleDebugLog,
  showToastStaggered,
  createToastQueue,
  initGlobalToastQueue,
  useGlobalToastQueue,
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
  showStartupToast,
  logEventConfig,
  logScriptOutput,
  isSessionPrimary,
  getPrimarySessionId,
  resetSessionTracking,
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
  ToastQueue,
  RunScriptConfig,
};
