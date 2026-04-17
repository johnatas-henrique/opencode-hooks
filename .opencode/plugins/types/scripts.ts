import type { PluginInput } from '@opencode-ai/plugin';
import type { ResolvedEventConfig, ScriptToastsConfig } from './config';

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
