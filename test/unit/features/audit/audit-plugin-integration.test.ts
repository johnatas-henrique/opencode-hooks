import {
  initAuditLogging,
  resetAuditLogging,
  getEventRecorder,
  getScriptRecorder,
  getErrorRecorder,
  getAuditLogger,
} from '.opencode/plugins/features/audit/plugin-integration';
import type { AuditConfig } from '.opencode/plugins/types/audit';

const defaultConfig: AuditConfig = {
  enabled: true,
  level: 'debug',
  basePath: '/tmp/audit-test',
  maxSizeMB: 1,
  maxAgeDays: 30,
  logTruncationKB: 0.5,
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

vi.mock('.opencode/plugins/features/audit/audit-logger', () => ({
  createAuditLogger: vi.fn(() => ({
    writeLine: vi.fn(),
    rotate: vi.fn(),
    cleanup: vi.fn(),
    archiveSession: vi.fn().mockResolvedValue(undefined),
    setSessionId: vi.fn(),
    getLastKnownSessionId: vi.fn().mockReturnValue('ses_123'),
  })),
  archiveLogFiles: vi.fn().mockResolvedValue(undefined),
  archiveLogFilesWithLock: vi.fn().mockResolvedValue(undefined),
  archiveFileIfNeeded: vi.fn().mockResolvedValue(true),
}));

vi.mock('.opencode/plugins/features/audit/event-recorder', () => ({
  createEventRecorder: vi.fn(() => ({
    logToolExecuteBefore: vi.fn(),
    logToolExecuteAfter: vi.fn(),
    logSessionEvent: vi.fn(),
  })),
}));

vi.mock('.opencode/plugins/features/audit/script-recorder', () => ({
  createScriptRecorder: vi.fn(() => ({
    logScript: vi.fn(),
  })),
}));

vi.mock('.opencode/plugins/features/audit/error-recorder', () => ({
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

describe('archiveAuditSession', () => {
  it('should archive session files with sessionId in name', async () => {
    vi.resetModules();
    const { initAuditLogging, setAuditSessionId, archiveAuditSession } =
      await import('.opencode/plugins/features/audit/plugin-integration');

    const testConfig: AuditConfig = {
      enabled: true,
      basePath: '/tmp/audit-test',
      level: 'debug',
      maxSizeMB: 10,
      maxAgeDays: 30,
      sessionId: 'test-session',
      logTruncationKB: 2,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [],
      files: {
        events: 'plugin-events_{session}.json',
        scripts: 'plugin-scripts_{session}.json',
        errors: 'plugin-errors_{session}.json',
        security: 'plugin-security_{session}.json',
        debug: 'plugin-debug_{session}.json',
      },
      archiveDir: 'audit-archive',
    };

    await initAuditLogging(testConfig);
    setAuditSessionId('ses_123');

    const { getAuditLogger } =
      await import('.opencode/plugins/features/audit/plugin-integration');
    const logger = getAuditLogger()!;
    const archiveMock = vi.spyOn(logger, 'archiveSession');

    await archiveAuditSession();
    expect(archiveMock).toHaveBeenCalledWith('ses_123');
  });

  it('should resolve when auditLogger is not initialized', async () => {
    vi.resetModules();
    resetAuditLogging();
    const { archiveAuditSession } =
      await import('.opencode/plugins/features/audit/plugin-integration');

    await expect(archiveAuditSession()).resolves.toBeUndefined();
  });
});

describe('setAuditSessionId', () => {
  it('should call setSessionId on auditLogger when initialized', async () => {
    vi.resetModules();
    const { initAuditLogging, setAuditSessionId } =
      await import('.opencode/plugins/features/audit/plugin-integration');

    await initAuditLogging(defaultConfig);

    const { getAuditLogger } =
      await import('.opencode/plugins/features/audit/plugin-integration');
    const logger = getAuditLogger()!;
    const setSessionIdMock = vi.spyOn(logger, 'setSessionId');

    setAuditSessionId('new-session-id');
    expect(setSessionIdMock).toHaveBeenCalledWith('new-session-id');
  });

  it('should not throw when auditLogger is not initialized', async () => {
    vi.resetModules();
    resetAuditLogging();
    const { setAuditSessionId } =
      await import('.opencode/plugins/features/audit/plugin-integration');

    expect(() => setAuditSessionId('any-id')).not.toThrow();
  });
});

describe('getAuditLogger', () => {
  it('should return undefined before initialization', () => {
    const recorder = getAuditLogger();
    expect(recorder).toBeUndefined();
  });

  it('should return auditLogger after initialization', async () => {
    await initAuditLogging(defaultConfig);
    const logger = getAuditLogger();
    expect(logger).toBeDefined();
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
