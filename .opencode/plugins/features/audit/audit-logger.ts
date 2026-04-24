import { appendFile, mkdir, readdir, rename, stat, unlink } from 'fs/promises';
import type {
  AuditLogger,
  AuditLoggerOptions,
  AuditFileType,
  AuditLoggerDependencies,
} from '../../types/audit';
import type { ArchiveDependencies } from '../../types/audit';

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

  function getFilePath(fileType: AuditFileType): string {
    return `${basePath}/plugin-${fileType}.json`;
  }

  async function ensureDirectory(): Promise<void> {
    await deps.mkdir(basePath, { recursive: true });
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
      const filePath = getFilePath(fileType);
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

  return { writeLine, cleanup };
}
