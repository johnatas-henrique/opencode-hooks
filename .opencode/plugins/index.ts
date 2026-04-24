export {
  initGlobalToastQueue,
  useGlobalToastQueue,
  showToastStaggered,
  createToastQueue,
  getGlobalToastQueue,
  resetGlobalToastQueue,
} from './core/toast-queue';
export type { ToastQueueOptions } from './types/toast';
export type { ToastQueue } from './types/toast';
export { handleDebugLog, sanitizeData } from './core/debug';
export {
  DEFAULT_SESSION_ID,
  TOAST_DURATION,
  TIMEOUT,
  STAGGER_MS,
  TIMER,
  SCRIPTS_DIR,
  MAX_PROMPT_LENGTH,
  TOOL,
  MAX_TOAST_LENGTH,
  DISABLED_CONFIG,
} from './core/constants';
export {
  isPrimarySession,
  getPrimarySessionId,
  resetSessionTracking,
} from './core/session';

export { userConfig } from './config/settings';
export {
  blockEnvFiles,
  blockGitForce,
  blockScriptsFailed,
  blockByPath,
  blockNoVerify,
  blockProtectedBranch,
  blockSecrets,
  blockLargeArgs,
} from './config/security-rules';

export {
  handlers,
  formatPluginStatus,
  getPluginStatus,
  getLatestLogFile,
  showActivePluginsToast,
  showStartupToast,
  appendToSession,
  waitForToastSilence,
  countToastsInLog,
} from './features/messages';
export type { EventHandler } from './types/events';
export type { PluginStatus } from './types/plugin';

export {
  resolveEventConfig,
  resolveToolConfig,
  DISABLED_CONFIG as DISABLED_EVENT_CONFIG,
} from './features/events';
export { normalizeInputForHandler } from './features/events/resolvers/normalize-input';
export type { ResolvedEventConfig } from './types/config';

export {
  runScript,
  runScriptAndHandle,
  addSubagentSession,
  isSubagent,
  resetSubagentTracking,
} from './features/scripts';
export type { ScriptRunResult, EventScriptConfig } from './types/scripts';

export { executeBlocking } from './features/block-system';

export { EventType } from './types/config';
