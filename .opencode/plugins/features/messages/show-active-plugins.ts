import {
  getPluginStatus,
  formatPluginStatus,
} from '.opencode/plugins/features/messages/plugin-status';
import { userConfig } from '.opencode/plugins/config/runtime';
import { DEFAULTS } from '.opencode/plugins/core/constants';
import type { ToastQueue } from '.opencode/plugins/types/toast';

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
    duration: options.duration ?? DEFAULTS.toast.durations.EIGHT_SECONDS,
  });
}
