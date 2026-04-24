import type {
  AuditConfig,
  EventRecorderDependencies,
  SessionInput,
  AuditRecord,
} from '../../types/audit';
import type {
  ToolExecuteBeforeInput,
  ToolExecuteAfterInput,
  ToolExecuteAfterOutput,
} from '../../types/core';

export function shouldLogEvents(config: AuditConfig): boolean {
  return config.enabled && config.level === 'debug';
}

export function extractTool(
  input: ToolExecuteBeforeInput | ToolExecuteAfterInput
): string {
  return input.tool ?? 'unknown';
}

export function extractSession(
  input: ToolExecuteBeforeInput | ToolExecuteAfterInput | SessionInput
): string {
  if ('sessionID' in input && input.sessionID) {
    return input.sessionID;
  }
  if ('info' in input && input.info?.id) {
    return input.info.id;
  }
  return 'unknown';
}

export function extractDirectory(input: SessionInput): string {
  if (input.info?.directory) {
    return input.info.directory;
  }
  if (input.directory) {
    return input.directory;
  }
  return 'unknown';
}

export function createToolExecuteBeforeRecord(
  input: ToolExecuteBeforeInput,
  shouldLogResult: boolean
): AuditRecord | null {
  if (!shouldLogResult) {
    return null;
  }

  return {
    ts: new Date().toISOString(),
    event: 'tool.execute.before',
    tool: extractTool(input),
    session: extractSession(input),
  };
}

export function createToolExecuteAfterRecord(
  input: ToolExecuteAfterInput,
  output: ToolExecuteAfterOutput | undefined,
  shouldLogResult: boolean
): AuditRecord | null {
  if (!shouldLogResult) {
    return null;
  }

  let status = 'success';
  let error: string | undefined;

  const hasExit = output?.metadata?.exit !== undefined;
  if (hasExit) {
    status = output!.metadata!.exit === 0 ? 'success' : 'error';
  }

  const hasNonZeroExit = hasExit && output!.metadata!.exit !== 0;
  if (hasNonZeroExit) {
    error = `Exit code: ${output!.metadata!.exit}`;
  }

  return {
    ts: new Date().toISOString(),
    event: 'tool.execute.after',
    tool: extractTool(input),
    session: extractSession(input),
    status,
    error,
  };
}

export function createSessionEventRecord(
  eventType: string,
  input: SessionInput,
  shouldLogResult: boolean
): AuditRecord | null {
  if (!shouldLogResult) {
    return null;
  }

  return {
    ts: new Date().toISOString(),
    event: eventType,
    session: extractSession(input),
    directory: extractDirectory(input),
  };
}

// ============================================
// Sanitization and Truncation Functions
// ============================================

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'authorization',
  'auth',
  'credential',
  'key',
  'privateKey',
  'cookie',
  'content',
  'env',
  'messages',
  'parts',
];

function isSensitiveField(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_FIELDS.some((sensitive) => lowerKey.includes(sensitive));
}

let globalTruncationKB = 10;

export function setGlobalTruncationKB(kb: number) {
  globalTruncationKB = kb;
}

function sanitizeAndTruncate(
  data: Record<string, unknown>,
  largeFields: string[],
  maxFieldSize: number,
  maxArrayItems: number
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const maxBytes = Math.floor(globalTruncationKB * 1024);

  for (const [key, value] of Object.entries(data)) {
    // Truncate known-large fields to logTruncationKB limit
    if (
      largeFields.includes(key) &&
      typeof value === 'string' &&
      value.length > maxBytes
    ) {
      result[key] = value.substring(0, maxBytes) + '... [truncated]';
      continue;
    }

    // Redact sensitive string fields (shows size for debug context)
    if (isSensitiveField(key) && typeof value === 'string') {
      result[key] = `[REDACTED: ${value.length} chars]`;
      continue;
    }

    // Truncate large strings
    if (typeof value === 'string' && value.length > maxFieldSize) {
      result[key] = value.substring(0, maxFieldSize) + '... [truncated]';
      continue;
    }

    // Handle nested objects (deep sanitization)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeAndTruncate(
        value as Record<string, unknown>,
        largeFields,
        maxFieldSize,
        maxArrayItems
      );
      continue;
    }

    // Handle arrays (limit items + sanitize)
    if (Array.isArray(value)) {
      const sanitized = value
        .slice(0, maxArrayItems)
        .map((item) =>
          typeof item === 'object' && item !== null
            ? sanitizeAndTruncate(
                item as Record<string, unknown>,
                largeFields,
                maxFieldSize,
                maxArrayItems
              )
            : item
        );
      if (value.length > maxArrayItems) {
        sanitized.push(`... [${value.length - maxArrayItems} more items]`);
      }
      result[key] = sanitized;
      continue;
    }

    result[key] = value;
  }

  return result;
}

// ============================================
// Generic Event Record Creation
// ============================================

export function createGenericEventRecord(
  eventType: string,
  input: Record<string, unknown> | undefined,
  output: Record<string, unknown> | undefined,
  toolName: string | undefined,
  shouldLogResult: boolean,
  largeFields: string[],
  maxFieldSize: number,
  maxArrayItems: number
): AuditRecord | null {
  if (!shouldLogResult) {
    return null;
  }

  // Extract session ID before sanitization
  let sessionId = 'unknown';
  if (input?.sessionID && typeof input.sessionID === 'string') {
    sessionId = input.sessionID;
  } else if (
    input?.info &&
    typeof input.info === 'object' &&
    input.info !== null &&
    'id' in input.info &&
    typeof (input.info as Record<string, unknown>).id === 'string'
  ) {
    sessionId = (input.info as Record<string, unknown>).id as string;
  }

  const record: AuditRecord = {
    ts: new Date().toISOString(),
    event: eventType,
    session: sessionId,
  };

  // Add tool name if available
  if (toolName || input?.tool) {
    record.tool = String(toolName || input?.tool);
  }

  // Add sanitized input
  if (input && Object.keys(input).length > 0) {
    record.input = sanitizeAndTruncate(
      input,
      largeFields,
      maxFieldSize,
      maxArrayItems
    );
  }

  // Add sanitized output
  if (output && Object.keys(output).length > 0) {
    record.output = sanitizeAndTruncate(
      output,
      largeFields,
      maxFieldSize,
      maxArrayItems
    );
  }

  return record;
}

export function createEventRecorder(
  config: AuditConfig,
  deps: EventRecorderDependencies
) {
  const canLog = shouldLogEvents(config);
  const maxFieldSize = config.maxFieldSize;
  const maxArrayItems = config.maxArrayItems;
  const largeFields = config.largeFields;
  globalTruncationKB = config.logTruncationKB;

  async function logToolExecuteBefore(
    input: ToolExecuteBeforeInput
  ): Promise<void> {
    const record = createToolExecuteBeforeRecord(input, canLog);
    if (record !== null) {
      await deps.writeLine('events', record);
    }
  }

  async function logToolExecuteAfter(
    input: ToolExecuteAfterInput,
    output?: ToolExecuteAfterOutput
  ): Promise<void> {
    const record = createToolExecuteAfterRecord(input, output, canLog);
    if (record !== null) {
      await deps.writeLine('events', record);
    }
  }

  async function logSessionEvent(
    eventType: string,
    input: SessionInput
  ): Promise<void> {
    const record = createSessionEventRecord(eventType, input, canLog);
    if (record !== null) {
      await deps.writeLine('events', record);
    }
  }

  async function logEvent(
    eventType: string,
    data: {
      sessionID?: string;
      input?: Record<string, unknown>;
      output?: Record<string, unknown>;
      tool?: string;
      context?: string;
    }
  ): Promise<void> {
    // Merge sessionID into input for proper extraction
    const inputWithSession = data.input
      ? { ...data.input, sessionID: data.sessionID ?? '' }
      : { sessionID: data.sessionID ?? '' };

    const record = createGenericEventRecord(
      eventType,
      inputWithSession,
      data.output,
      data.tool,
      canLog,
      largeFields,
      maxFieldSize,
      maxArrayItems
    );
    if (record !== null) {
      if (data.context) {
        const recordWithContext: AuditRecord & { context?: string } = record;
        recordWithContext.context = data.context;
      }
      await deps.writeLine('events', record);
    }
  }

  return {
    logToolExecuteBefore,
    logToolExecuteAfter,
    logSessionEvent,
    logEvent,
  };
}
