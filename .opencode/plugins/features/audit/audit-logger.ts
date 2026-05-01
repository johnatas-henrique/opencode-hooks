import { appendFile, mkdir, readdir, rename, stat, unlink } from 'fs/promises';
import type {
  AuditLogger,
  AuditLoggerOptions,
  AuditFileType,
  AuditLoggerDependencies,
} from '../../types/audit';
import type { ArchiveDependencies } from '../../types/audit';
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

export async function archiveFileIfNeeded(
  sourcePath: string,
  archivePath: string,
  maxSizeBytes: number = 1024 * 1024,
  deps?: Partial<ArchiveDependencies>
): Promise<boolean> {
  const mkdirFn = deps?.mkdir ?? mkdir;
  const renameFn = deps?.rename ?? rename;
  const statFn = deps?.stat ?? stat;

  try {
    const fileStat = await statFn(sourcePath);
    if (fileStat.size < maxSizeBytes) {
      return false;
    }
  } catch {
    return false;
  }

  await mkdirFn(archivePath, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = sourcePath.split('/').pop()!;
  const archiveFilePath = `${archivePath}/${fileName.replace('.json', '')}-${timestamp}.json`;

  await renameFn(sourcePath, archiveFilePath);
  return true;
}

function createDefaultDeps(): AuditLoggerDependencies {
  return {
    appendFile,
    mkdir,
    stat,
    readdir,
    unlink,
    rename,
  };
}

export function createAuditLogger(options: AuditLoggerOptions): AuditLogger {
  const { basePath, config } = options;
  const deps = { ...createDefaultDeps(), ...options.deps };
  const writeQueue = new Map<string, Promise<void>>();
  let currentSessionId: string | null = config.sessionId ?? null;

  const defaultFiles = {
    events: 'plugin-events.json',
    scripts: 'plugin-scripts.json',
    errors: 'plugin-errors.json',
    security: 'plugin-security.json',
    debug: 'plugin-debug.json',
  };

  function resolveSessionId(sessionIdFromEvent?: string): string {
    return (sessionIdFromEvent || currentSessionId) ?? '';
  }
  function getFilePath(fileType: AuditFileType, sessionId?: string): string {
    const configFiles = config.files || defaultFiles;
    const fileName = configFiles[fileType as keyof typeof configFiles];

    if (fileName.includes('{session}')) {
      const resolvedSessionId = resolveSessionId(sessionId);
      const sessionFileName = fileName.replace('{session}', resolvedSessionId);
      return `${basePath}/${sessionFileName}`;
    }
    return `${basePath}/${fileName}`;
  }

  async function ensureDirectory(): Promise<void> {
    await deps.mkdir(basePath, { recursive: true });
  }

  async function writeLine(
    fileType: AuditFileType,
    data: Record<string, unknown>,
    sessionId?: string
  ): Promise<void> {
    if (!config.enabled) return;

    if (config.level === 'audit' && fileType === 'events') {
      return;
    }

    const jsonLine = JSON.stringify(data) + '\n';

    const writeOperation = async (): Promise<void> => {
      await ensureDirectory();
      const filePath = getFilePath(fileType, sessionId);
      await deps.appendFile(filePath, jsonLine);

      if (
        fileType === 'events' ||
        fileType === 'errors' ||
        fileType === 'scripts'
      ) {
        const archiveDir = `${basePath}/plugin-archive`;
        await archiveFileIfNeeded(
          filePath,
          archiveDir,
          config.maxSizeMB * 1024 * 1024,
          deps as unknown as Partial<{
            mkdir: typeof mkdir;
            rename: typeof rename;
            stat: typeof stat;
          }>
        );
      }
    };

    const currentQueue = writeQueue.get(fileType) ?? Promise.resolve();
    const newQueue = currentQueue.then(writeOperation).catch(() => {});
    writeQueue.set(fileType, newQueue);
    await newQueue;
  }

  async function cleanup(): Promise<void> {
    if (config.maxAgeDays <= 0) return;
    if (!deps.stat) return;

    try {
      const files = await deps.readdir(basePath);
      const cutoffTime = Date.now() - config.maxAgeDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (!file.endsWith('.gz')) continue;
        const filePath = `${basePath}/${file}`;
        try {
          const fileStat = await deps.stat(filePath);
          if (fileStat.mtimeMs < cutoffTime) {
            await deps.unlink(filePath);
          }
        } catch {
          // Skip files that can't be stat'd
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  async function archiveSession(sessionId?: string): Promise<void> {
    const targetSessionId = sessionId ?? currentSessionId;

    if (!targetSessionId) {
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = `${basePath}/${config.archiveDir || 'audit-archive'}`;
    await deps.mkdir(archiveDir, { recursive: true });

    const fileTypes: AuditFileType[] = [
      'events',
      'scripts',
      'errors',
      'security',
      'debug',
    ];

    for (const fileType of fileTypes) {
      const sourcePath = getFilePath(fileType, targetSessionId);
      try {
        const fileStat = await deps.stat(sourcePath);
        if (fileStat.size > 0) {
          const fileName = sourcePath.split('/').pop()!;
          const archivePath = `${archiveDir}/${fileName.replace('.json', '')}_${targetSessionId}_${timestamp}.json`;
          await deps.rename(sourcePath, archivePath);
        }
      } catch {
        // File doesn't exist, skip
      }
    }
  }

  function setSessionId(sessionId: string): void {
    if (!sessionId.startsWith('ses_')) {
      debugLog('setSessionId: IGNORED - not a valid sessionId:', sessionId);
      return;
    }

    debugLog('setSessionId: setting to:', sessionId);
    currentSessionId = sessionId;
  }

  function getLastKnownSessionId(): string | undefined {
    debugLog('getLastKnownSessionId: returning:', currentSessionId);
    return currentSessionId ?? undefined;
  }
  return {
    writeLine,
    cleanup,
    archiveSession,
    setSessionId,
    getLastKnownSessionId,
  };
}
