import {
  initAuditLogging,
  resetAuditLogging,
  getEventRecorder,
  getScriptRecorder,
  getErrorRecorder,
} from '../../.opencode/plugins/features/audit/plugin-integration';
import type { AuditConfig } from '../../.opencode/plugins/types/audit';

const defaultConfig: AuditConfig = {
  enabled: true,
  level: 'debug',
  basePath: '/tmp/audit-test',
  maxSizeMB: 1,
  maxAgeDays: 30,
  truncationKB: 0.5,
  maxFieldSize: 1000,
  maxArrayItems: 50,
  largeFields: [],
};

const mockMkdir = vi.fn().mockResolvedValue(undefined);
const mockRename = vi.fn().mockResolvedValue(undefined);
const mockStat = vi.fn().mockResolvedValue({ size: 500 });
const mockReaddir = vi
  .fn()
  .mockResolvedValue([
    'plugin-events.json',
    'plugin-scripts.json',
    'plugin-errors.json',
    'other-file.json',
  ]);

vi.mock('../../.opencode/plugins/features/audit/audit-logger', () => ({
  createAuditLogger: vi.fn(() => ({
    writeLine: vi.fn(),
    rotate: vi.fn(),
    cleanup: vi.fn(),
  })),
  archiveLogFiles: vi.fn().mockResolvedValue(undefined),
  archiveLogFilesWithLock: vi.fn().mockResolvedValue(undefined),
  archiveFileIfNeeded: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../.opencode/plugins/features/audit/event-recorder', () => ({
  createEventRecorder: vi.fn(() => ({
    logToolExecuteBefore: vi.fn(),
    logToolExecuteAfter: vi.fn(),
    logSessionEvent: vi.fn(),
  })),
}));

vi.mock('../../.opencode/plugins/features/audit/script-recorder', () => ({
  createScriptRecorder: vi.fn(() => ({
    logScript: vi.fn(),
  })),
}));

vi.mock('../../.opencode/plugins/features/audit/error-recorder', () => ({
  createErrorRecorder: vi.fn(() => ({
    logError: vi.fn(),
  })),
}));

vi.mock('fs/promises', () => ({
  readdir: () => mockReaddir(),
  rename: () => mockRename(),
  mkdir: () => mockMkdir(),
  stat: () => mockStat(),
}));

describe('archiveAllJsonFiles', () => {
  it('should archive all json files in directory', async () => {
    vi.resetModules();
    vi.resetModules();
    const { archiveAllJsonFiles } =
      await import('../../.opencode/plugins/features/audit/plugin-integration');
    mockMkdir.mockResolvedValue(undefined);
    mockRename.mockResolvedValue(undefined);
    await archiveAllJsonFiles('/tmp/audit-test');
    expect(mockMkdir).toHaveBeenCalled();
  });

  it('should skip archive files already containing -archive', async () => {
    vi.resetModules();
    mockReaddir.mockResolvedValue([
      'plugin-events.json',
      'plugin-archive-2024-01-01.json',
    ]);
    const { archiveAllJsonFiles } =
      await import('../../.opencode/plugins/features/audit/plugin-integration');
    await archiveAllJsonFiles('/tmp/audit-test');
  });

  it('should handle errors when archiving individual files', async () => {
    vi.resetModules();
    mockReaddir.mockResolvedValue(['plugin-events.json']);
    mockRename.mockRejectedValue(new Error('Access denied'));
    const { archiveAllJsonFiles } =
      await import('../../.opencode/plugins/features/audit/plugin-integration');
    await archiveAllJsonFiles('/tmp/audit-test');
  });

  it('should handle readdir errors gracefully', async () => {
    vi.resetModules();
    mockReaddir.mockRejectedValue(new Error('Directory not found'));
    const { archiveAllJsonFiles } =
      await import('../../.opencode/plugins/features/audit/plugin-integration');
    await archiveAllJsonFiles('/tmp/audit-test-nonexistent');
  });
});

describe('Audit Plugin Integration', () => {
  beforeEach(() => {
    vi.resetModules();
    resetAuditLogging();
  });

  describe('getEventRecorder', () => {
    it('should return undefined before initialization', () => {
      const recorder = getEventRecorder();
      expect(recorder).toBeUndefined();
    });
  });

  describe('getScriptRecorder', () => {
    it('should return undefined before initialization', () => {
      const recorder = getScriptRecorder();
      expect(recorder).toBeUndefined();
    });
  });

  describe('getErrorRecorder', () => {
    it('should return undefined before initialization', () => {
      const recorder = getErrorRecorder();
      expect(recorder).toBeUndefined();
    });
  });

  describe('initAuditLogging', () => {
    it('should initialize and return recorders', async () => {
      await initAuditLogging(defaultConfig);

      expect(getEventRecorder()).toBeDefined();
      expect(getScriptRecorder()).toBeDefined();
      expect(getErrorRecorder()).toBeDefined();
    });

    it('should be idempotent - calling twice should not reinitialize', async () => {
      await initAuditLogging(defaultConfig);
      const firstEventRecorder = getEventRecorder();

      await initAuditLogging(defaultConfig);
      const secondEventRecorder = getEventRecorder();

      expect(firstEventRecorder).toBe(secondEventRecorder);
    });

    it('should handle concurrent calls - return same promise', async () => {
      const promise1 = initAuditLogging(defaultConfig);
      const promise2 = initAuditLogging(defaultConfig);
      const promise3 = initAuditLogging(defaultConfig);

      expect(promise1).toBe(promise2);
      expect(promise2).toBe(promise3);

      await Promise.all([promise1, promise2, promise3]);
      expect(getEventRecorder()).toBeDefined();
    });
  });
});
