import type {
  DebugRecord,
  AuditLogger,
  AuditFileType,
} from '../../types/audit';

export interface DebugRecorder {
  logDebug(input: {
    message: string;
    level?: 'info' | 'warn' | 'error';
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export function createDebugRecorder(logger: AuditLogger): DebugRecorder {
  return {
    async logDebug(input) {
      const record: DebugRecord = {
        ts: new Date().toISOString(),
        event: 'debug',
        message: input.message,
        level: input.level ?? 'info',
        data: input.data,
      };
      await logger.writeLine(
        'debug' as AuditFileType,
        record as Record<string, unknown>
      );
    },
  };
}

export function getDebugRecorder(): DebugRecorder | null {
  const recorder = (globalThis as unknown as Record<string, unknown>)
    .__opencode_debug_recorder;
  return recorder as DebugRecorder | null;
}

export function setDebugRecorder(recorder: DebugRecorder): void {
  (globalThis as unknown as Record<string, unknown>).__opencode_debug_recorder =
    recorder;
}
