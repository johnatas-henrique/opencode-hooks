import type { TuiToast } from '@opencode-ai/plugin/tui';

export interface ShowToastOptions {
  title: string;
  message?: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}

/**
 * ToastDirector manages a queue of toasts with staggered display.
 * Encapsulates all concurrency state; can be instantiated per-use or as singleton.
 */
export interface ToastDirector {
  /** Enqueue a toast for display */
  enqueue(toast: TuiToast): void;

  /** Wait for all pending toasts to be displayed */
  flush(): Promise<void>;

  /** Clear the queue and cancel pending timers */
  clear(): void;

  /** Number of toasts waiting to be displayed */
  readonly pending: number;

  /** Whether a toast is currently being displayed */
  readonly isProcessing: boolean;

  /** Gracefully shutdown: wait for active toast then stop */
  shutdown(): Promise<void>;
}

export interface ToastQueue {
  add(toast: TuiToast): void;
  addMultiple(toasts: TuiToast[]): void;
  clear(): void;
  flush(): Promise<void>;
  readonly pending: number;
}

export interface ToastQueueOptions {
  delay?: number;
  stagger?: boolean;
}
