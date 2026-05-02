import type { AuditConfig } from '.opencode/plugins/types/config';

export function createTestAuditConfig(
  overrides: Partial<AuditConfig> = {}
): AuditConfig {
  return {
    enabled: true,
    level: 'debug',
    maxSizeMB: 10,
    maxAgeDays: 30,
    logTruncationKB: 10,
    maxFieldSize: 1000,
    maxArrayItems: 50,
    basePath: '/tmp/audit-test/test',
    largeFields: [],
    ...overrides,
  };
}

export function createAuditLevelTestConfig(
  level: 'debug' | 'info' | 'warn' | 'error' | 'audit'
): AuditConfig {
  return createTestAuditConfig({ level });
}
