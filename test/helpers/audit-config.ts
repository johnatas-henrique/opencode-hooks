import type { AuditConfig } from '.opencode/plugins/types/audit';

export function makeAuditConfig(
  overrides: Partial<AuditConfig> = {}
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
    largeFields: ['output', 'content'],
    files: {
      events: 'events.json',
      scripts: 'scripts.json',
      errors: 'errors.json',
      security: 'security.json',
      debug: 'debug.json',
    },
    ...overrides,
  };
}
