import { createAuditLogger } from './audit-logger';
import { createEventRecorder } from './event-recorder';
import { createScriptRecorder } from './script-recorder';
import { createErrorRecorder } from './error-recorder';
import { DEFAULT_AUDIT_CONFIG } from '../../types/audit';
import type { AuditConfig } from '../../types/audit';
import {
  LOG_DIR,
  AUDIT_EVENTS_FILE,
  AUDIT_SCRIPTS_FILE,
  AUDIT_ERRORS_FILE,
  AUDIT_ARCHIVE_DIR,
} from '../../core/constants';
import { archiveLogFilesWithLock } from './audit-logger';
import type { ScriptRecorder } from '../../types/audit';

let initPromise: Promise<void> | null = null;
let auditLogger: ReturnType<typeof createAuditLogger>;
let eventRecorder: ReturnType<typeof createEventRecorder>;
let scriptRecorder: ReturnType<typeof createScriptRecorder>;
let errorRecorder: ReturnType<typeof createErrorRecorder>;

export function initAuditLogging(config?: AuditConfig): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const auditConfig = config ?? DEFAULT_AUDIT_CONFIG;

    auditLogger = createAuditLogger({
      basePath: LOG_DIR,
      config: auditConfig,
    });

    eventRecorder = createEventRecorder(auditConfig, {
      writeLine: auditLogger.writeLine.bind(auditLogger),
    });

    scriptRecorder = createScriptRecorder(auditConfig, {
      writeLine: auditLogger.writeLine.bind(auditLogger),
    });

    errorRecorder = createErrorRecorder(auditConfig, {
      writeLine: auditLogger.writeLine.bind(auditLogger),
    });

    await archiveLogFilesWithLock(LOG_DIR, LOG_DIR + '/' + AUDIT_ARCHIVE_DIR, {
      events: AUDIT_EVENTS_FILE,
      scripts: AUDIT_SCRIPTS_FILE,
      errors: AUDIT_ERRORS_FILE,
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

export function resetAuditLogging() {
  initPromise = null;
}
