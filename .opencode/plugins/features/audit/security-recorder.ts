import type {
  SecurityRecord,
  AuditLogger,
  AuditFileType,
} from '../../types/audit';

export interface SecurityRecorder {
  logSecurity(input: {
    sessionID?: string;
    toolName?: string;
    rule: string;
    reason?: string;
    input?: Record<string, unknown>;
  }): Promise<void>;
}

export function createSecurityRecorder(logger: AuditLogger): SecurityRecorder {
  return {
    async logSecurity(input) {
      const record: SecurityRecord = {
        ts: new Date().toISOString(),
        event: 'block.security',
        session: input.sessionID,
        toolName: input.toolName,
        rule: input.rule,
        reason: input.reason,
        input: input.input,
      };
      await logger.writeLine(
        'security' as AuditFileType,
        record as Record<string, unknown>
      );
    },
  };
}

export function getSecurityRecorder(): SecurityRecorder | null {
  const recorder = (globalThis as unknown as Record<string, unknown>)
    .__opencode_security_recorder;
  return recorder as SecurityRecorder | null;
}

export function setSecurityRecorder(recorder: SecurityRecorder): void {
  (
    globalThis as unknown as Record<string, unknown>
  ).__opencode_security_recorder = recorder;
}
