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
import { archiveLogFiles } from './audit-logger';
import type { ScriptRecorder } from '../../types/audit';

let initialized = false;
let auditLogger: ReturnType<typeof createAuditLogger>;
let eventRecorder: ReturnType<typeof createEventRecorder>;
let scriptRecorder: ReturnType<typeof createScriptRecorder>;
let errorRecorder: ReturnType<typeof createErrorRecorder>;

export async function initAuditLogging(config?: AuditConfig): Promise<void> {
  if (initialized) return;

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

  await archiveLogFiles(LOG_DIR, LOG_DIR + '/' + AUDIT_ARCHIVE_DIR, {
    events: AUDIT_EVENTS_FILE,
    scripts: AUDIT_SCRIPTS_FILE,
    errors: AUDIT_ERRORS_FILE,
  });

  initialized = true;
}

export function getEventRecorder() {
  return initialized ? eventRecorder : undefined;
}

export function getScriptRecorder(): ScriptRecorder | undefined {
  return initialized ? scriptRecorder : undefined;
}

export function getErrorRecorder() {
  return initialized ? errorRecorder : undefined;
}
