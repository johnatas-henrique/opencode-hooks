import type { TuiToast } from '@opencode-ai/plugin/tui';

export interface ShowToastOptions {
  title: string;
  message?: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
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
