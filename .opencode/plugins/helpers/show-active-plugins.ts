import type { TuiToast } from '@opencode-ai/plugin/tui';
import { getPluginStatus, formatPluginStatus } from './plugin-status';

type ToastQueue = {
  add: (toast: TuiToast) => void;
};

export async function showActivePluginsToast(
  queue: ToastQueue,
  options: { duration?: number } = {}
): Promise<void> {
  const statuses = getPluginStatus();
  const message = formatPluginStatus(statuses);

  const hasIssues = statuses.some(
    (s) => s.status === 'failed' || s.status === 'incompatible'
  );

  queue.add({
    title: 'Plugin Status',
    message,
    variant: hasIssues ? 'warning' : 'info',
    duration: options.duration ?? 8000,
  });
}
