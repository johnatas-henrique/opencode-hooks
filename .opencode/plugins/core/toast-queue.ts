import type { TuiToast } from '@opencode-ai/plugin/tui';
import type { ToastQueue } from '.opencode/plugins/types/toast';
import { ToastDirectorImpl } from '.opencode/plugins/features/core/toast-director';

let globalToastQueue: ToastQueue | null = null;

export function initGlobalToastQueue(
  showFn: (toast: TuiToast) => void | Promise<void>,
  onToastDropped: (dropped: TuiToast) => void,
  staggerMs: number,
  maxSize: number
): ToastQueue {
  const director = new ToastDirectorImpl(
    showFn,
    { staggerMs, maxSize },
    onToastDropped
  );

  globalToastQueue = {
    add: (t) => director.enqueue(t),
    addMultiple: (ts) => ts.forEach((t) => director.enqueue(t)),
    clear: () => director.clear(),
    flush: () => director.flush(),
    get pending() {
      return director.pending;
    },
  };
  return globalToastQueue;
}

export function useGlobalToastQueue(): ToastQueue {
  if (!globalToastQueue) {
    throw new Error(
      'ToastQueue not initialized. Call initGlobalToastQueue first.'
    );
  }
  return globalToastQueue;
}

export function resetGlobalToastQueue() {
  globalToastQueue = null;
}
