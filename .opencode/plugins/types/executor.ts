import type { EventVariant } from './config';
import type { ScriptRunResult } from './scripts';
import type { PluginInput } from '@opencode-ai/plugin';
import type { ResolvedEventConfig, ScriptToastsConfig } from './config';
import type { ScriptRecorder } from './audit';

export interface ScriptRunnerDeps {
  ctx: PluginInput;
  sessionId: string;
  eventType: string;
  resolved: ResolvedEventConfig;
  scriptToasts: ScriptToastsConfig;
  scriptRecorder?: ScriptRecorder;
  toolName?: string;
  timestamp?: string;
}

export interface ScriptExecutorDeps {
  executeScript: (script: string, arg?: string) => Promise<ScriptRunResult>;
  audit?: ScriptAuditLogger;
  session: SessionAppender;
  toast?: ToastNotifier;
  isSubagent: (sessionId: string) => boolean;
}

export interface ScriptAuditLogger {
  logScript(
    input: ScriptInput,
    result: { output: string; error: string | null; exitCode: number }
  ): Promise<void>;
}

export interface SessionAppender {
  appendToSession(sessionId: string, text: string): Promise<void>;
}

export interface ToastNotifier {
  showToast(
    title: string,
    message: string,
    variant: EventVariant,
    duration: number
  ): void;
}

export interface ScriptExecutorOptions {
  skipAudit?: boolean;
  skipSession?: boolean;
  suppressToast?: boolean;
  runOnlyOnce?: boolean;
}

export interface ScriptInput {
  script: string;
  args: string[];
  startTime: number;
}

export interface ScriptResultForAudit {
  output: string;
  error: string | null;
  exitCode: number;
}
