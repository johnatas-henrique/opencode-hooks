import type { PluginInput } from '@opencode-ai/plugin';
import type { ResolvedEventConfig } from '.opencode/plugins/types/config';
import type { ScriptRecorder } from '.opencode/plugins/types/audit';
import type { EventRecorder } from '.opencode/plugins/types/audit';
import type { ToastQueue } from '.opencode/plugins/types/toast';
import type { ScriptEntry } from '.opencode/plugins/types/config';
import type { EventVariant } from '.opencode/plugins/types/config';
import type { ScriptRunResult } from '.opencode/plugins/types/scripts';

export interface ScriptAuditLogger {
  logScript: (
    input: ScriptInput,
    result: { output: string; error: string | null; exitCode: number }
  ) => Promise<void>;
}

export interface SessionAppender {
  appendToSession: (sessionId: string, text: string) => Promise<void>;
}

export interface ToastNotifier {
  showToast: (
    title: string,
    message: string,
    variant: EventVariant,
    duration: number
  ) => void;
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
  stdin?: string;
  scriptType?: string;
}

export interface ScriptResultForAudit {
  output: string;
  error: string | null;
  exitCode: number;
}

export interface ScriptExecutorDeps {
  executeScript: (script: string, arg?: string) => Promise<ScriptRunResult>;
  audit?: ScriptAuditLogger;
  session: SessionAppender;
  toast?: ToastNotifier;
  isSubagent: (sessionId: string) => boolean;
}

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

import type { ScriptToastsConfig } from '.opencode/plugins/types/config';

export interface HookEvent {
  ctx: PluginInput;
  eventType: string;
  resolved: ResolvedEventConfig;
  sessionId: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  toolName?: string;
}

export type ExecuteScriptFn = (
  script: ScriptEntry,
  eventType: string,
  toolName: string,
  input: Record<string, unknown>,
  output?: Record<string, unknown>
) => Promise<{
  script: string;
  output: string;
  exitCode: number;
  stdin?: string;
}>;

export interface HookExecutorDeps {
  executeScript: ExecuteScriptFn;
  isSubagent: (sessionId: string) => boolean;
  appendToSession: (
    ctx: PluginInput,
    sessionId: string,
    text: string
  ) => Promise<void>;
  toastQueue: ToastQueue;
  eventRecorder?: EventRecorder;
  scriptRecorder?: ScriptRecorder;
  logDisabledEvents: (() => boolean) | boolean;
}
