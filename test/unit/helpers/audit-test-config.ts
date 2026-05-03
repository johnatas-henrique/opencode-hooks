import type { AuditConfig } from '.opencode/plugins/types/audit';

export function createAuditConfig(
  overrides?: Partial<AuditConfig>
): AuditConfig {
  return {
    enabled: true,
    level: 'debug',
    basePath: '/tmp/test-audit',
    maxSizeMB: 1,
    maxAgeDays: 30,
    logTruncationKB: 10,
    maxFieldSize: 1000,
    maxArrayItems: 50,
    largeFields: [
      'patch',
      'diff',
      'content',
      'snapshot',
      'output',
      'result',
      'text',
    ],
    ...overrides,
  };
}
