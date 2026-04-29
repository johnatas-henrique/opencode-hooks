import type { ToastCallback } from './messages';

export type { ToastCallback };

export type PersistToastCallback = (params: {
  title: string;
  message: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}) => void | Promise<void>;

export interface SaveToFileOptions {
  content: string;
  filename?: string;
  showToast?: PersistToastCallback;
}
