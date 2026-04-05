import type { TuiToast } from '@opencode-ai/plugin/tui';
import { saveToFile } from './save-to-file';
import { STAGGER_MS, TOAST_DURATION } from './constants';

export type ShowToastOptions = {
  delay?: number;
  stagger?: boolean;
};

let activeToast: Promise<void> | null = null;

export async function showToastStaggered(
  showFn: (toast: TuiToast) => void | Promise<void>,
  toast: TuiToast,
  options: ShowToastOptions = {}
): Promise<void> {
  const { delay = 0, stagger = true } = options;

  if (stagger && activeToast) {
    await activeToast;
    await new Promise((resolve) => setTimeout(resolve, STAGGER_MS.DEFAULT));
  }

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  activeToast = Promise.resolve(showFn(toast));
  await activeToast;
}

export function createToastQueue(
  showFn: (toast: TuiToast) => void | Promise<void>,
  options: { staggerMs?: number; maxSize?: number } = {}
) {
  const { staggerMs = STAGGER_MS.QUEUE, maxSize = 50 } = options;
  const queue: TuiToast[] = [];
  let processingLock: Promise<void> | null = null;
  let activeTimers: ReturnType<typeof setTimeout>[] = [];

  const processQueue = async () => {
    if (processingLock) {
      await processingLock;
      if (queue.length === 0) return;
    }

    processingLock = (async () => {
      while (queue.length > 0) {
        const toast = queue.shift();
        if (toast) {
          const duration = toast.duration ?? TOAST_DURATION.FIVE_SECONDS;
          await new Promise<void>((resolve) => {
            const t = setTimeout(resolve, staggerMs);
            activeTimers.push(t);
          });
          await Promise.resolve(showFn(toast));
          await new Promise<void>((resolve) => {
            const t = setTimeout(resolve, duration);
            activeTimers.push(t);
          });
        }
      }
      processingLock = null;
    })();

    await processingLock;
  };

  const logDroppedToast = (title: string) => {
    saveToFile({
      content: `[WARN] Toast queue full, dropping: ${title}\n`,
    });
  };

  const queueObj = {
    add: (toast: TuiToast) => {
      if (queue.length >= maxSize) {
        const dropped = queue.shift();
        logDroppedToast(dropped?.title || 'unknown');
      }
      queue.push(toast);
      processQueue();
    },
    addMultiple: (toasts: TuiToast[]) => {
      for (const toast of toasts) {
        if (queue.length >= maxSize) {
          const dropped = queue.shift();
          logDroppedToast(dropped?.title || 'unknown');
        }
        queue.push(toast);
      }
      processQueue();
    },
    clear: () => {
      queue.length = 0;
      for (const t of activeTimers) clearTimeout(t);
      activeTimers = [];
    },
    flush: async () => {
      if (processingLock) {
        await processingLock;
      }
    },
    get pending() {
      return queue.length;
    },
  };

  return queueObj;
}

let globalToastQueue: ReturnType<typeof createToastQueue> | null = null;

export function initGlobalToastQueue(
  showFn: (toast: TuiToast) => void | Promise<void>
): ToastQueue {
  globalToastQueue = createToastQueue(showFn, {
    staggerMs: STAGGER_MS.DEFAULT,
  });
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

export type ToastQueue = ReturnType<typeof createToastQueue>;
