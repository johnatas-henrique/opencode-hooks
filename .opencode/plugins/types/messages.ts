import { EventVariant } from '.opencode/plugins/types/config';

export type ToastCallback = (params: {
  title: string;
  message?: string;
  variant?: EventVariant;
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
  variant: EventVariant;
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

export interface PluginStatus {
  name: string;
  status: 'active' | 'failed' | 'incompatible';
  error?: string;
  source?: 'built-in' | 'user';
}

export interface PluginEntry {
  level: string;
  message: string;
  name?: string;
  path?: string;
  pkg?: string;
  error?: string;
}
