import type { TuiToast } from '@opencode-ai/plugin/tui';
import { DEFAULTS } from './constants';
import type { ToastQueue, ToastQueueOptions } from '../types/toast';
import { ToastDirectorImpl } from '../features/core/toast-director';

let globalToastQueue: ToastQueue | null = null;

export async function showToastStaggered(
  showFn: (toast: TuiToast) => void | Promise<void>,
  toast: TuiToast,
  options: ToastQueueOptions = {}
): Promise<void> {
  // Delegates to director-based implementation
  const director = new ToastDirectorImpl(showFn, {
    staggerMs: options.stagger ? DEFAULTS.toast.stagger.DEFAULT : 0,
    maxSize: 50,
  });
  director.enqueue(toast);
  await director.flush();
}

/**
 * Creates a toast queue with staggered processing.
 * Now implemented as a thin wrapper around ToastDirectorImpl.
 */
export function createToastQueue(
  showFn: (toast: TuiToast) => void | Promise<void>,
  options: { staggerMs?: number; maxSize?: number } = {}
): ToastQueue {
  const director = new ToastDirectorImpl(showFn, options);

  return {
    add: (toast: TuiToast) => director.enqueue(toast),
    addMultiple: (toasts: TuiToast[]) => {
      for (const t of toasts) director.enqueue(t);
    },
    clear: () => director.clear(),
    flush: () => director.flush(),
    get pending() {
      return director.pending;
    },
  };
}

export function initGlobalToastQueue(
  showFn: (toast: TuiToast) => void | Promise<void>
): ToastQueue {
  const director = new ToastDirectorImpl(showFn, {
    staggerMs: DEFAULTS.toast.stagger.DEFAULT,
    maxSize: 50,
  });

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

export function getGlobalToastQueue(
  showFn?: (toast: TuiToast) => void | Promise<void>
): ToastQueue {
  if (!globalToastQueue && showFn) {
    return initGlobalToastQueue(showFn);
  }
  if (!globalToastQueue) {
    throw new Error(
      'ToastQueue not initialized. Call initGlobalToastQueue first.'
    );
  }
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
