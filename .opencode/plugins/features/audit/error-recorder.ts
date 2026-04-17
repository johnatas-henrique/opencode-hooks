import type {
  AuditConfig,
  ErrorRecord,
  ErrorType,
  ErrorRecorderDependencies,
  ConfigErrorContext,
  CodeErrorContext,
  ErrorContext,
} from '../../types/audit';

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
