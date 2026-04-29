import { createAuditLogger, archiveFileIfNeeded } from './audit-logger';
import { createEventRecorder } from './event-recorder';
import { createScriptRecorder } from './script-recorder';
import { createErrorRecorder } from './error-recorder';
import type { AuditConfig } from '../../types/audit';
import type { ScriptRecorder } from '../../types/audit';
import { readdir, rename, mkdir, stat } from 'fs/promises';

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

export function resetAuditLogging() {
  initPromise = null;
}

export async function archiveAllJsonFiles(basePath: string): Promise<void> {
  try {
    const files = await readdir(basePath);

    const jsonFiles = files.filter(
      (f) => f.endsWith('.json') && !f.includes('-archive')
    );

    const archiveDir = `${basePath}/plugin-archive`;
    await mkdir(archiveDir, { recursive: true });

    for (const file of jsonFiles) {
      const filePath = `${basePath}/${file}`;
      await archiveFileIfNeeded(filePath, archiveDir, 0, {
        mkdir,
        rename,
        stat,
      });
    }
  } catch {
    // Silently ignore - app is shutting down, no one to see errors
  }
}
