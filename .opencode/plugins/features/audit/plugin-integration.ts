import { createAuditLogger } from '.opencode/plugins/features/audit/audit-logger';
import { createEventRecorder } from '.opencode/plugins/features/audit/event-recorder';
import { createScriptRecorder } from '.opencode/plugins/features/audit/script-recorder';
import { createErrorRecorder } from '.opencode/plugins/features/audit/error-recorder';
import type { AuditConfig } from '.opencode/plugins/types/audit';
import type { ScriptRecorder } from '.opencode/plugins/types/audit';

let initPromise: Promise<void> | null = null;
let auditLogger: ReturnType<typeof createAuditLogger>;
let eventRecorder: ReturnType<typeof createEventRecorder>;
let scriptRecorder: ReturnType<typeof createScriptRecorder>;
let errorRecorder: ReturnType<typeof createErrorRecorder>;

export function initAuditLogging(config: AuditConfig): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    auditLogger = createAuditLogger({
      basePath: config.basePath,
      config,
    });

    eventRecorder = createEventRecorder(config, {
      writeLine: auditLogger.writeLine.bind(auditLogger),
    });

    scriptRecorder = createScriptRecorder(config, {
      writeLine: auditLogger.writeLine.bind(auditLogger),
    });

    errorRecorder = createErrorRecorder(config, {
      writeLine: auditLogger.writeLine.bind(auditLogger),
    });
  })();

  return initPromise;
}

export function getEventRecorder() {
  return initPromise ? eventRecorder : undefined;
}

export function getScriptRecorder(): ScriptRecorder | undefined {
  return initPromise ? scriptRecorder : undefined;
}

export function getErrorRecorder() {
  return initPromise ? errorRecorder : undefined;
}

export function getAuditLogger() {
  return initPromise ? auditLogger : undefined;
}

export function resetAuditLogging() {
  initPromise = null;
}
