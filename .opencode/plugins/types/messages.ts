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

export type BuildMessageFn = (
  event: Record<string, unknown>,
  allowedFields?: string[]
) => string;

export interface HandlerConfig {
  title: string;
  variant: 'success' | 'warning' | 'error' | 'info';
  duration: number;
  defaultScript: string;
  buildMessage: BuildMessageFn;
  allowedFields?: string[];
  defaultTemplate?: string;
}

export interface BuildKeysEvent {
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  properties?: Record<string, unknown>;
}
