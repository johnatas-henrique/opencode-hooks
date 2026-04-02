import type { TuiToast } from "@opencode-ai/plugin/tui";

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
  options: { staggerMs?: number } = {}
) {
  const queue: TuiToast[] = [];
  const staggerMs = options.staggerMs ?? 500;
  let processing = false;
  let currentProcessing: Promise<void> | null = null;

  const processQueue = () => {
    if (processing || queue.length === 0) return;
    processing = true;

    const run = async () => {
      while (queue.length > 0) {
        const toast = queue.shift();
        if (toast) {
          const duration = toast.duration ?? 3000;
          await new Promise((resolve) => setTimeout(resolve, staggerMs));
          await Promise.resolve(showFn(toast));
          await new Promise((resolve) => setTimeout(resolve, duration));
        }
      }
      processing = false;
    };

    currentProcessing = run();
    return currentProcessing;
  };

  const queueObj = {
    add: (toast: TuiToast) => {
      queue.push(toast);
      processQueue();
    },
    addMultiple: (toasts: TuiToast[]) => {
      queue.push(...toasts);
      processQueue();
    },
    clear: () => {
      queue.length = 0;
    },
    flush: async () => {
      if (currentProcessing) {
        await currentProcessing;
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
