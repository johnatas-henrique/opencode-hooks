export interface ShowToastOptions {
  title: string;
  message?: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}
