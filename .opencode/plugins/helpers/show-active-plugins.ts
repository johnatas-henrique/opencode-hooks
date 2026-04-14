import type { TuiToast } from '@opencode-ai/plugin/tui';
import { getPluginStatus, formatPluginStatus } from './plugin-status';
import { userConfig } from './config/index';
import { TOAST_DURATION } from './constants';

type ToastQueue = {
  add: (toast: TuiToast) => void;
};

export async function showActivePluginsToast(
  queue: ToastQueue,
  options: { duration?: number } = {}
): Promise<void> {
  const showStatus = userConfig.showPluginStatus;
  if (!showStatus) {
    return;
  }

  const statuses = getPluginStatus();
  const displayMode = userConfig.pluginStatusDisplayMode;
  const message = formatPluginStatus(statuses, displayMode);

  const hasIssues = statuses.some(
    (s) => s.status === 'failed' || s.status === 'incompatible'
  );

  queue.add({
    title: 'Plugin Status',
    message,
    variant: hasIssues ? 'warning' : 'info',
    duration: options.duration ?? TOAST_DURATION.EIGHT_SECONDS,
  });
}
