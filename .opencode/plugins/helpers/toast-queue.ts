import type { TuiToast } from '@opencode-ai/plugin/tui';
import { saveToFile } from './save-to-file';

export type ShowToastOptions = {
  delay?: number;
  stagger?: boolean;
};

let activeToast: Promise<void> | null = null;

const defaultStagger = 300;

export async function showToastStaggered(
  showFn: (toast: TuiToast) => void | Promise<void>,
  toast: TuiToast,
  options: ShowToastOptions = {}
): Promise<void> {
  const { delay = 0, stagger = true } = options;

  if (stagger && activeToast) {
    await activeToast;
    await new Promise((resolve) => setTimeout(resolve, defaultStagger));
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
  const { staggerMs = 500, maxSize = 50 } = options;
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
          const duration = toast.duration ?? 3000;
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

export function getGlobalToastQueue(
  showFn: (toast: TuiToast) => void | Promise<void>
) {
  if (!globalToastQueue) {
    globalToastQueue = createToastQueue(showFn, { staggerMs: defaultStagger });
  }
  return globalToastQueue;
}

export function resetGlobalToastQueue() {
  globalToastQueue = null;
}
