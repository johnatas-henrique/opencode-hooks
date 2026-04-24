import {
  initAuditLogging,
  getEventRecorder,
  getScriptRecorder,
  getErrorRecorder,
} from '../../.opencode/plugins/features/audit/plugin-integration';
import type { AuditConfig } from '../../.opencode/plugins/types/audit';

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

vi.mock('../../.opencode/plugins/features/audit/audit-logger', () => ({
  createAuditLogger: vi.fn(() => ({
    writeLine: vi.fn(),
    cleanup: vi.fn(),
  })),
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

describe('Audit Plugin Integration', () => {
  beforeEach(() => {
    vi.resetModules();
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
      await initAuditLogging(TEST_CONFIG);

      expect(getEventRecorder()).toBeDefined();
      expect(getScriptRecorder()).toBeDefined();
      expect(getErrorRecorder()).toBeDefined();
    });

    it('should be idempotent - calling twice should not reinitialize', async () => {
      await initAuditLogging(TEST_CONFIG);
      const firstEventRecorder = getEventRecorder();

      await initAuditLogging(TEST_CONFIG);
      const secondEventRecorder = getEventRecorder();

      expect(firstEventRecorder).toBe(secondEventRecorder);
    });
  });
});
