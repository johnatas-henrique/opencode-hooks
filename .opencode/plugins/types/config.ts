import type { ToolExecuteBeforeInput, ToolExecuteBeforeOutput } from './core';
import type { AuditConfig } from './audit';
import { EventType } from './events';

export type EventVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastOverride {
  enabled?: boolean;
  title?: string;
  message?: string;
  messageFn?: (
    input: Record<string, unknown>,
    output?: Record<string, unknown>
  ) => string | undefined;
  variant?: EventVariant;
  duration?: number;
}

export interface ScriptEntry {
  source: 'native' | 'claude';
  path: string;
  matcher?: string;
  async?: boolean;
  timeout?: number;
  passStdin?: boolean;
}

export interface ClaudeHookSettings {
  enabled: boolean;
}

export interface EventOverride {
  enabled?: boolean;
  debug?: boolean;
  toast?: boolean | ToastOverride;
  scripts?: ScriptEntry[];
  runScripts?: boolean;
  runOnlyOnce?: boolean;
  logToAudit?: boolean;
  appendToSession?: boolean;
  allowedFields?: string[];
}

export type EventConfig = boolean | EventOverride;
export type ToolConfig = boolean | ToolOverride;

export type PluginStatusDisplayMode =
  | 'user-only'
  | 'user-separated'
  | 'all-labeled';

export interface ScriptToastsConfig {
  showOutput: boolean;
  showError: boolean;
  outputVariant: EventVariant;
  errorVariant: EventVariant;
  outputDuration: number;
  errorDuration: number;
  outputTitle: string;
  errorTitle: string;
}

export interface UserEventsConfig {
  enabled: boolean;
  logDisabledEvents: boolean;
  audit: AuditConfig;
  showPluginStatus: boolean;
  pluginStatusDisplayMode: PluginStatusDisplayMode;
  scriptToasts: ScriptToastsConfig;
  default: EventOverride;
  loadClaudeHookSettings: ClaudeHookSettings;
  events: Partial<Record<EventType, EventConfig>>;
  tools: {
    [EventType.TOOL_EXECUTE_AFTER]: Record<string, ToolConfig>;
    [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: Record<string, ToolConfig>;
    [EventType.TOOL_EXECUTE_BEFORE]: Record<string, ToolOverride>;
  };
}

export interface ResolvedEventConfig {
  enabled: boolean;
  debug: boolean;
  toast: boolean;
  toastTitle: string;
  toastMessage: string;
  toastVariant: EventVariant;
  toastDuration: number;
  scripts: ScriptEntry[];
  runScripts: boolean;
  logToAudit: boolean;
  appendToSession: boolean;
  runOnlyOnce: boolean;
  scriptToasts: ScriptToastsConfig;
  allowedFields?: string[];
  block: BlockCheck[];
}

export interface ScriptResult {
  script: string;
  exitCode: number;
  output?: string;
}

export type BlockPredicate = (
  input: ToolExecuteBeforeInput,
  output: ToolExecuteBeforeOutput,
  scriptResults: ScriptResult[]
) => boolean;

export interface BlockCheck {
  check: BlockPredicate;
  message: string;
}

export interface FileTemplate {
  enabled: boolean;
  template?: string;
  path?: string;
}

export interface ToolOverride {
  enabled?: boolean;
  debug?: boolean;
  toast?: boolean | ToolOverride;
  scripts?: ScriptEntry[];
  runScripts?: boolean;
  runOnlyOnce?: boolean;
  logToAudit?: boolean;
  appendToSession?: boolean;
  block?: BlockCheck[];
  messageFn?: (input: unknown, output?: unknown) => string | undefined;
}
