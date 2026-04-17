import {
  initAuditLogging,
  getEventRecorder,
  getScriptRecorder,
  getErrorRecorder,
} from '../../.opencode/plugins/features/audit/plugin-integration';

vi.mock('../../.opencode/plugins/features/audit/audit-logger', () => ({
  createAuditLogger: vi.fn(() => ({
    writeLine: vi.fn(),
    rotate: vi.fn(),
    cleanup: vi.fn(),
  })),
  archiveLogFiles: vi.fn().mockResolvedValue(undefined),
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
      await initAuditLogging();

      expect(getEventRecorder()).toBeDefined();
      expect(getScriptRecorder()).toBeDefined();
      expect(getErrorRecorder()).toBeDefined();
    });

    it('should be idempotent - calling twice should not reinitialize', async () => {
      await initAuditLogging();
      const firstEventRecorder = getEventRecorder();

      await initAuditLogging();
      const secondEventRecorder = getEventRecorder();

      expect(firstEventRecorder).toBe(secondEventRecorder);
    });
  });
});
