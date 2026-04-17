import type { AuditConfig, ErrorRecord } from '../../types/audit';

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
}

export type ErrorContext = ConfigErrorContext | CodeErrorContext;

export function getErrorType(context: ErrorContext): ErrorType {
  if ('error' in context) {
    return 'code';
  }
  return 'config';
}

export function createErrorRecord(
  context: ErrorContext,
  shouldLog: boolean
): ErrorRecord | null {
  if (!shouldLog) {
    return null;
  }

  const errorType = getErrorType(context);
  const base = {
    ts: new Date().toISOString(),
    type: errorType,
  };

  if (errorType === 'config') {
    const configContext = context as ConfigErrorContext;
    return {
      ...base,
      error: configContext.message,
      eventType: configContext.eventType,
      toolName: configContext.toolName,
      scriptPath: configContext.scriptPath,
    };
  }

  const codeContext = context as CodeErrorContext;
  return {
    ...base,
    error: codeContext.error.message,
    stack: codeContext.error.stack,
    context: codeContext.context,
  };
}

export function createErrorRecorder(
  config: AuditConfig,
  deps: ErrorRecorderDependencies
) {
  const canLog = config.enabled;

  async function logError(context: ErrorContext): Promise<void> {
    const record = createErrorRecord(context, canLog);
    if (record !== null) {
      await deps.writeLine('errors', record);
    }
  }

  return { logError };
}
