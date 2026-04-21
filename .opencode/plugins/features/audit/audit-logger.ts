import {
  appendFile,
  mkdir,
  readdir,
  rename,
  stat,
  unlink,
  open,
} from 'fs/promises';
import { createGzip } from 'zlib';
import { pipeline } from 'stream';
import type {
  AuditLogger,
  AuditLoggerOptions,
  ArchiveDependencies,
  AuditFileType,
  AuditLoggerDependencies,
  GzipDependencies,
  FileHandle,
} from '../../types/audit';
import { DEFAULT_AUDIT_CONFIG } from '../../types/audit';

export async function archiveLogFiles(
  basePath: string,
  archivePath: string,
  files: { events: string; scripts: string; errors: string },
  deps?: Partial<ArchiveDependencies>
): Promise<void> {
  const mkdirFn = deps?.mkdir ?? mkdir;
  const renameFn = deps?.rename ?? rename;
  const statFn = deps?.stat ?? stat;

  await mkdirFn(archivePath, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFiles = [files.events, files.scripts, files.errors];

  for (const file of logFiles) {
    const sourcePath = `${basePath}/${file}`;
    const destPath = `${archivePath}/${file.replace('.json', '')}-${timestamp}.json`;

    try {
      await statFn(sourcePath);
      await renameFn(sourcePath, destPath);
    } catch {
      // File doesn't exist, skip
    }
  }
}

const ARCHIVE_LOCK_TIMEOUT_MS = 30000; // 30 seconds max wait

export async function archiveLogFilesWithLock(
  basePath: string,
  archivePath: string,
  files: { events: string; scripts: string; errors: string },
  deps?: Partial<ArchiveDependencies>
): Promise<void> {
  const mkdirFn = deps?.mkdir ?? mkdir;
  const renameFn = deps?.rename ?? rename;
  const statFn = deps?.stat ?? stat;
  const unlinkFn = deps?.unlink ?? unlink;
  const openFn = deps?.open ?? open;

  const lockFilePath = `${basePath}/.audit-archive.lock`;

  let lockAcquired = false;
  let lockFileHandle: { close: () => Promise<void> } | null = null;

  try {
    // Try to acquire lock (exclusive create with 'wx' flag)
    try {
      lockFileHandle = await openFn(lockFilePath, 'wx');
      lockAcquired = true;
    } catch (err) {
      // Check if lock is stale
      if ((err as { code?: string }).code === 'EEXIST') {
        try {
          const lockContent =
            (await deps?.readFile?.(lockFilePath, 'utf-8')) ?? '';
          const lockTime = parseInt(lockContent.split('-')[0], 10);
          const now = Date.now();

          if (!isNaN(lockTime) && now - lockTime > ARCHIVE_LOCK_TIMEOUT_MS) {
            // Stale lock - remove and retry
            await unlinkFn(lockFilePath);
            lockFileHandle = await openFn(lockFilePath, 'wx');
            lockAcquired = true;
          } else {
            // Another valid process is archiving - skip this run
            return;
          }
        } catch {
          // Could not read lock file, skip this run
          return;
        }
      } else {
        throw err;
      }
    }

    // Execute archive
    await archiveLogFiles(basePath, archivePath, files, {
      mkdir: mkdirFn,
      rename: renameFn,
      stat: statFn,
      unlink: unlinkFn,
    });
  } finally {
    // Release lock if we acquired it
    if (lockAcquired && lockFileHandle !== null) {
      try {
        await lockFileHandle.close();
      } catch {
        // Ignore close errors
      }
      try {
        await unlinkFn(lockFilePath);
      } catch {
        // Ignore unlink errors (maybe already deleted)
      }
    }
  }
}

export function createGzipFile(deps: GzipDependencies) {
  return async function gzipFile(
    sourcePath: string,
    destPath: string
  ): Promise<void> {
    const gzip = deps.createGzip();
    const source = await deps.open(sourcePath, 'r');
    const dest = await deps.open(destPath, 'w');
    const sourceStream = source.createReadStream();
    const destStream = dest.createWriteStream();
    await new Promise<void>((resolve, reject) => {
      deps.pipeline(
        sourceStream as never,
        gzip as never,
        destStream as never,
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    await source.close();
    await dest.close();
  };
}

const defaultGzipDeps: GzipDependencies = {
  createGzip,
  open: open as unknown as (path: string, flags: string) => Promise<FileHandle>,
  pipeline: pipeline as unknown as (...args: unknown[]) => Promise<void>,
};

function createDefaultDeps(
  overrides?: Partial<AuditLoggerDependencies>
): AuditLoggerDependencies {
  return {
    appendFile: overrides?.appendFile ?? appendFile,
    mkdir: overrides?.mkdir ?? mkdir,
    stat: overrides?.stat,
    readdir: overrides?.readdir ?? readdir,
    unlink: overrides?.unlink ?? unlink,
    gzipFile: overrides?.gzipFile ?? createGzipFile(defaultGzipDeps),
  };
}

export function createAuditLogger(options: AuditLoggerOptions): AuditLogger {
  const { basePath, config = DEFAULT_AUDIT_CONFIG } = options;
  const deps = createDefaultDeps(options.deps);
  const fileCounters = new Map<string, number>();
  const writeQueue = new Map<string, Promise<void>>();

  function getFilePath(fileType: AuditFileType): string {
    return `${basePath}/${config.files[fileType]}`;
  }

  function getRotatePath(fileType: AuditFileType): string {
    const fileName = config.files[fileType] ?? `plugin-${fileType}.json`;
    const baseName = fileName.replace('.json', '');
    const date = new Date().toISOString().split('T')[0];
    const counter = fileCounters.get(fileType) ?? 0;
    return `${basePath}/${baseName}-${date}-${String(counter + 1).padStart(3, '0')}.json.gz`;
  }

  async function ensureDirectory(): Promise<void> {
    await deps.mkdir(basePath, { recursive: true });
  }

  async function checkRotation(fileType: AuditFileType): Promise<void> {
    if (!deps.stat) return;
    const filePath = getFilePath(fileType);
    try {
      const fileStat = await deps.stat(filePath);
      const maxSizeBytes = config.maxSizeMB * 1024 * 1024;
      if (fileStat.size >= maxSizeBytes) {
        await rotate(fileType);
      }
    } catch {
      // File doesn't exist, no rotation needed
    }
  }

  async function writeLine(
    fileType: AuditFileType,
    data: Record<string, unknown>
  ): Promise<void> {
    if (!config.enabled) return;

    if (config.level === 'audit' && fileType === 'events') {
      return;
    }

    const jsonLine = JSON.stringify(data) + '\n';

    const writeOperation = async (): Promise<void> => {
      await ensureDirectory();
      await checkRotation(fileType);
      const filePath = getFilePath(fileType);
      await deps.appendFile(filePath, jsonLine);
    };

    const currentQueue = writeQueue.get(fileType) ?? Promise.resolve();
    const newQueue = currentQueue.then(writeOperation).catch(() => {});
    writeQueue.set(fileType, newQueue);
    await newQueue;
  }

  async function rotate(fileType: AuditFileType): Promise<void> {
    const sourcePath = getFilePath(fileType);
    const destPath = getRotatePath(fileType);

    try {
      if (deps.stat) await deps.stat(sourcePath);
      await deps.gzipFile(sourcePath, destPath);
      await deps.unlink(sourcePath);
      fileCounters.set(fileType, (fileCounters.get(fileType) ?? 0) + 1);
    } catch {
      // File doesn't exist, nothing to rotate
    }
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

  return { writeLine, rotate, cleanup };
}
