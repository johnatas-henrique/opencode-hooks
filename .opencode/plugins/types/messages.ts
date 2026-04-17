export type ToastCallback = (params: {
  title: string;
  message?: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}) => void;

export interface PluginStartupInfo {
  version: string;
  pluginCount: number;
}

export interface StartupToastOptions {
  getLogFile?: () => string | null;
}
