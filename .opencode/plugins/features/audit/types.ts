export type AuditLogLevel = 'debug' | 'audit';

export type AuditFileType = 'events' | 'scripts' | 'errors';

export interface AuditFilesConfig {
  events: string;
  scripts: string;
  errors: string;
}

export interface AuditRetentionConfig {
  maxAgeDays: number;
  maxSizeMB: number;
}

export interface AuditConfig {
  enabled: boolean;
  level: AuditLogLevel;
  maxSizeMB: number;
  maxAgeDays: number;
  truncationKB: number;
  files: AuditFilesConfig;
}

export interface AuditFileStat {
  size: number;
  mtimeMs: number;
}

export interface AuditLoggerDependencies {
  appendFile: (path: string, data: string) => Promise<void>;
  mkdir: (
    path: string,
    options?: { recursive?: boolean }
  ) => Promise<void | string>;
  stat?: (path: string) => Promise<AuditFileStat>;
  readdir: (path: string) => Promise<string[]>;
  unlink: (path: string) => Promise<void>;
  gzipFile: (sourcePath: string, destPath: string) => Promise<void>;
}

export interface FileHandle {
  createReadStream: () => { pipe: (dest: unknown) => unknown };
  createWriteStream: () => { end: () => void };
  close: () => Promise<void>;
}

export interface GzipDependencies {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createGzip: () => { pipe: (dest: any) => any };
  open: (path: string, flags: string) => Promise<FileHandle>;
  pipeline: (
    source: unknown,
    gzip: unknown,
    dest: unknown,
    callback: (err: Error | null) => void
  ) => Promise<void>;
}

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  enabled: true,
  level: 'debug',
  maxSizeMB: 10,
  maxAgeDays: 30,
  truncationKB: 10,
  files: {
    events: 'plugin-events.jsonl',
    scripts: 'plugin-scripts.jsonl',
    errors: 'plugin-errors.jsonl',
  },
};
