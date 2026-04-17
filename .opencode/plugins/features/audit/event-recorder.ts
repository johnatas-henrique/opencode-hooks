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

export function createEventRecorder(
  config: AuditConfig,
  deps: EventRecorderDependencies
) {
  const canLog = shouldLogEvents(config);

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

  return {
    logToolExecuteBefore,
    logToolExecuteAfter,
    logSessionEvent,
  };
}
