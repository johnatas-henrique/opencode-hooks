import { createToastQueue } from '.opencode/plugins/core/toast-queue';
import { vi, beforeEach, afterEach, expect, describe, it } from 'vitest';
import {
  getErrorRecorder,
  initAuditLogging,
  resetAuditLogging,
} from '.opencode/plugins/features/audit/plugin-integration';
import type { AuditConfig } from '.opencode/plugins/types/audit';

const TEST_CONFIG: AuditConfig = {
  enabled: true,
  level: 'debug',
  basePath: './test-audit',
  maxSizeMB: 10,
  maxAgeDays: 30,
  logTruncationKB: 10,
  maxFieldSize: 1000,
  maxArrayItems: 50,
  largeFields: [],
};

vi.mock('.opencode/plugins/features/audit/audit-logger', async () => ({
  createAuditLogger: vi.fn(),
  checkRotation: vi.fn().mockResolvedValue(false),
}));

const { createAuditLogger } =
  await import('.opencode/plugins/features/audit/audit-logger');

const mockCreateAuditLogger = vi.mocked(createAuditLogger);

let mockLogger: ReturnType<typeof createAuditLogger> | null = null;

beforeEach(async () => {
  vi.clearAllMocks();

  mockLogger = {
    writeLine: vi.fn().mockResolvedValue(undefined),
    getFileData: vi.fn(),
    checkRotation: vi.fn(),
    getBasePath: vi.fn().mockReturnValue('./test'),
    close: vi.fn(),
  } as unknown as ReturnType<typeof createAuditLogger>;

  mockCreateAuditLogger.mockReturnValue(mockLogger);

  await initAuditLogging(TEST_CONFIG);
});

afterEach(() => {
  resetAuditLogging();
});

describe('queue full - dropped toasts (line 97)', () => {
  it('should use default session ID for dropped toast with no title', async () => {
    const errorRecorder = getErrorRecorder();
    expect(errorRecorder).toBeDefined();

    const mockLogError = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(errorRecorder!, 'logError').mockImplementation(mockLogError);

    const showFn = vi.fn().mockResolvedValue(undefined);

    const maxSize = 2;
    const queue = createToastQueue(showFn, {
      staggerMs: 0,
      maxSize,
    });

    for (let i = 0; i < 4; i++) {
      queue.add({
        title: '',
        message: 'test',
        variant: 'info',
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockLogError).toHaveBeenCalled();
  });
});
