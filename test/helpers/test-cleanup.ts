import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const TEST_DIRS = [
  '/tmp/audit-test',
  '/tmp/audit-test-2',
  '/tmp/audit-test-3',
  'test-temp-init',
  'test-temp-validation-file',
  'test-temp-validation-init',
];

const PRODUCTION_TEST_DIR = path.resolve(
  process.cwd(),
  'production/session-logs'
);

export async function cleanupTestDirs(): Promise<void> {
  for (const dir of TEST_DIRS) {
    try {
      if (existsSync(dir)) {
        await rm(dir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

const PRODUCTION_FILES = [
  'plugin-events_123.json',
  'plugin-events_chat-session.json',
  'plugin-events_cmd-session.json',
  'plugin-events_exp-session.json',
  'plugin-events_init.json',
  'plugin-events_perm-session.json',
  'plugin-events_plugin-init.json',
  'plugin-events_unknown.json',
  'plugin-scripts_init.json',
];

async function deleteTestFile(fileName: string): Promise<void> {
  const filePath = path.join(PRODUCTION_TEST_DIR, fileName);
  try {
    if (existsSync(filePath)) {
      await rm(filePath);
    }
  } catch {
    // Ignore individual file errors
  }
}

export async function cleanupProductionTestFiles(): Promise<void> {
  if (!existsSync(PRODUCTION_TEST_DIR)) return;

  await Promise.all(PRODUCTION_FILES.map(deleteTestFile));
}

export function createTempAuditDir(prefix = 'audit-test'): string {
  const uniqueId = Math.random().toString(36).substring(2, 10);
  return `/tmp/${prefix}-${uniqueId}`;
}
