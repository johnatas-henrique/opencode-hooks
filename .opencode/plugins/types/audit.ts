export type AuditLogLevel = 'debug' | 'audit';

export type AuditFileType =
  | 'events'
  | 'scripts'
  | 'errors'
  | 'security'
  | 'debug';

export interface AuditConfig {
  enabled: boolean;
  level: AuditLogLevel;
  basePath: string;
  maxSizeMB: number;
  maxAgeDays: number;
  truncationKB: number;
  maxFieldSize: number;
  maxArrayItems: number;
  largeFields: string[];
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
  stat: (path: string) => Promise<AuditFileStat>;
  readdir: (path: string) => Promise<string[]>;
  unlink: (path: string) => Promise<void>;
  rename: (src: string, dest: string) => Promise<void>;
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

export interface AuditRecord {
  ts: string;
  event: string;
  tool?: string;
  session?: string;
  status?: string;
  duration?: number;
  error?: string;
  directory?: string;
  input?: Record<string, unknown>; // Sanitized input data
  output?: Record<string, unknown>; // Sanitized output data
  [key: string]: unknown;
}

export interface EventRecorderDependencies {
  writeLine: (
    fileType: 'events',
    data: Record<string, unknown>
  ) => Promise<void>;
}

export interface ScriptRecorderDependencies {
  writeLine: (
    fileType: 'scripts',
    data: Record<string, unknown>
  ) => Promise<void>;
}

export interface ScriptRecord {
  ts: string;
  script: string;
  args: string[];
  exit: number;
  duration?: number;
  output?: string;
  error?: string;
  [key: string]: unknown;
}

export interface ErrorRecord {
  ts: string;
  type: 'config' | 'code';
  error: string;
  stack?: string;
  eventType?: string;
  toolName?: string;
  scriptPath?: string;
  context?: string;
  [key: string]: unknown;
}

export interface SecurityRecord {
  ts: string;
  event: 'block.security';
  session?: string;
  toolName?: string;
  rule: string;
  reason?: string;
  input?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DebugRecord {
  ts: string;
  event: 'debug';
  message: string;
  level?: 'info' | 'warn' | 'error';
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SessionInput {
  sessionID?: string;
  info?: {
    id?: string;
    title?: string;
    directory?: string;
  };
  directory?: string;
}

export interface AuditLogger {
  writeLine(
    fileType: AuditFileType,
    data: Record<string, unknown>
  ): Promise<void>;
  cleanup(): Promise<void>;
}

export interface AuditLoggerOptions {
  basePath: string;
  config: AuditConfig;
  deps?: Partial<AuditLoggerDependencies>;
}

export interface EventRecorder {
  logToolExecuteBefore(input: {
    tool?: string;
    sessionID?: string;
    callID?: string;
  }): Promise<void>;
  logToolExecuteAfter(
    input: {
      tool?: string;
      sessionID?: string;
      callID?: string;
    },
    output?: {
      metadata?: { exit?: number };
    }
  ): Promise<void>;
  logSessionEvent(eventType: string, input: SessionInput): Promise<void>;
  logEvent(
    eventType: string,
    data: {
      sessionID?: string;
      input?: Record<string, unknown>;
      output?: Record<string, unknown>;
      tool?: string;
      context?: string;
    }
  ): Promise<void>;
}

export interface ScriptRecorderDependencies {
  writeLine: (
    fileType: 'scripts',
    data: Record<string, unknown>
  ) => Promise<void>;
}

export interface ScriptInput {
  script: string;
  args?: string[];
  startTime?: number;
}

export interface ScriptRecorderResult {
  output: string;
  error: string | null;
  exitCode: number;
}

export interface ScriptRecorder {
  logScript(input: ScriptInput, result: ScriptRecorderResult): Promise<void>;
}

export type ErrorType = 'config' | 'code';

export interface ErrorRecorderDependencies {
  writeLine: (
    fileType: 'errors',
    data: Record<string, unknown>
  ) => Promise<void>;
}

export interface ConfigErrorContext {
  scriptPath?: string;
  eventType?: string;
  toolName?: string;
  message: string;
}

export interface CodeErrorContext {
  error: Error;
  context?: string;
  skipStack?: boolean; // If true, stack trace will not be included in the error record
}

export type ErrorContext = ConfigErrorContext | CodeErrorContext;

export interface ArchiveDependencies {
  mkdir: (
    path: string,
    options?: { recursive?: boolean }
  ) => Promise<void | string>;
  rename: (src: string, dest: string) => Promise<void>;
  stat: (path: string) => Promise<AuditFileStat>;
  unlink: (path: string) => Promise<void>;
  readFile?: (path: string, encoding: string) => Promise<string>;
  appendFile?: (path: string, data: string) => Promise<void>;
  readdir?: (path: string) => Promise<string[]>;
  open?: (
    path: string,
    flags: string
  ) => Promise<{ close: () => Promise<void> }>;
}
