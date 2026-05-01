import { createAuditLogger } from './audit-logger';
import { createEventRecorder } from './event-recorder';
import { createScriptRecorder } from './script-recorder';
import { createErrorRecorder } from './error-recorder';
import type { AuditConfig } from '../../types/audit';
import type { ScriptRecorder } from '../../types/audit';
import fs from 'fs';
import path from 'path';

function getDebugLogPath(): string {
  return path.join(
    process.cwd(),
    'production',
    'session-logs',
    'audit-debug.log'
  );
}

function debugLog(...args: unknown[]): void {
  try {
    const logPath = getDebugLogPath();
    const timestamp = new Date().toISOString();
    const message = args
      .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
      .join(' ');
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch {
    // Silently ignore if we can't write to debug log
  }
}

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

export function getLastKnownSessionId(): string | undefined {
  if (!auditLogger) return undefined;
  return auditLogger.getLastKnownSessionId();
}

export function setAuditSessionId(sessionId: string): void {
  if (auditLogger) {
    auditLogger.setSessionId(sessionId);
  }
}

export function archiveAuditSession(): Promise<void> {
  if (!auditLogger) {
    debugLog('archiveAuditSession: auditLogger is null');
    return Promise.resolve();
  }

  const targetSessionId = auditLogger.getLastKnownSessionId();
  debugLog(
    'archiveAuditSession: getLastKnownSessionId() returned:',
    targetSessionId
  );

  if (!targetSessionId) {
    debugLog('archiveAuditSession: no targetSessionId, skipping archive');
    return Promise.resolve();
  }

  debugLog(
    'archiveAuditSession: calling archiveSession with:',
    targetSessionId
  );
  return auditLogger.archiveSession(targetSessionId);
}

export function resetAuditLogging() {
  initPromise = null;
}
