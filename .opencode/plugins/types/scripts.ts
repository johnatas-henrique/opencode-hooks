import type { PluginInput } from '@opencode-ai/plugin';
import type { EventInput } from '.opencode/plugins/types/core';
import type {
  ResolvedEventConfig,
  ScriptToastsConfig,
} from '.opencode/plugins/types/config';

export interface RunScriptConfigOptions {
  command: string;
  args?: string[];
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
}

export interface EventScriptConfig {
  ctx: PluginInput;
  script: string;
  scriptArg?: string;
  toolName?: string;
  timestamp: string;
  eventType: string;
  resolved: ResolvedEventConfig;
  scriptToasts: ScriptToastsConfig;
  sessionId?: string;
}

export interface ScriptRunResult {
  output: string;
  error: string | null;
  exitCode: number;
}

export interface ScriptExecutionResult {
  script: string;
  output: string | undefined;
}

export interface HookResult {
  action: 'allow' | 'block' | 'error';
  reason?: string;
  updatedInput?: EventInput;
  additionalContext?: string;
  systemMessage?: string;
}
