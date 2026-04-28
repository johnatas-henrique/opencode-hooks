import type { EventVariant } from './config';
import type { ScriptRunResult } from './scripts';

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
