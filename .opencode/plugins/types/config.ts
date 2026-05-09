import type { AuditConfig } from '.opencode/plugins/types/audit';
import { OpenCodeEvents } from '.opencode/plugins/types/core';
import type { OpenCodeEventType } from '.opencode/plugins/types/core';

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
  loadGlobalClaudeHooks: boolean;
  loadLocalClaudeHooks: boolean;
}

export interface EventOverride {
  enabled?: boolean;
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

export interface ToastQueueConfig {
  staggerMs: number;
  maxSize: number;
}

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
  toastQueue: ToastQueueConfig;
  events: Partial<Record<OpenCodeEventType, EventConfig>>;
  tools: {
    [OpenCodeEvents.TOOL_EXECUTE_AFTER]: Record<string, ToolConfig>;
    [OpenCodeEvents.TOOL_EXECUTE_AFTER_SUBAGENT]: Record<string, ToolConfig>;
    [OpenCodeEvents.TOOL_EXECUTE_BEFORE]: Record<string, ToolOverride>;
  };
}

export interface ResolvedEventConfig {
  enabled: boolean;
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
}

export interface ScriptResult {
  script: string;
  exitCode: number;
  output: string;
}

export interface FileTemplate {
  enabled: boolean;
  template?: string;
  path?: string;
}

export interface ToolOverride {
  enabled?: boolean;
  toast?: boolean | ToolOverride;
  scripts?: ScriptEntry[];
  runScripts?: boolean;
  runOnlyOnce?: boolean;
  logToAudit?: boolean;
  appendToSession?: boolean;
  messageFn?: (input: unknown, output?: unknown) => string | undefined;
}

// Claude hooks interfaces
export interface ClaudeHookGroup {
  hooks: ClaudeHook[];
  matcher?: string;
}

export interface ClaudeHook {
  command: string;
  async?: boolean;
  timeout?: number;
}

export interface ClaudeSettings {
  hooks?: Record<string, ClaudeHookGroup[]>;
  disableAllHooks?: boolean;
}

export interface ScriptConstantsConfig {
  dir: string;
}

export interface CoreConstantsConfig {
  defaultSessionId: 'unknown';
  maxPromptLength: 10000;
  maxToastLength: 1000;
  tool: {
    TASK: 'task';
    SUBAGENT_TYPE_ARG: 'subagent_type';
  };
}

export interface AuditFileNamesConfig {
  events: 'plugin-events.json';
  scripts: 'plugin-scripts.json';
  errors: 'plugin-errors.json';
  security: 'plugin-security.json';
  debug: 'plugin-debug.json';
}
