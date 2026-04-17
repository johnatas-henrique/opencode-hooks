import {
  initAuditLogging,
  getEventRecorder,
  getScriptRecorder,
  getErrorRecorder,
} from '../../.opencode/plugins/features/audit/plugin-integration';

jest.mock('../../.opencode/plugins/features/audit/audit-logger', () => ({
  createAuditLogger: jest.fn(() => ({
    writeLine: jest.fn(),
    rotate: jest.fn(),
    cleanup: jest.fn(),
  })),
  archiveLogFiles: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../.opencode/plugins/features/audit/event-recorder', () => ({
  createEventRecorder: jest.fn(() => ({
    logToolExecuteBefore: jest.fn(),
    logToolExecuteAfter: jest.fn(),
    logSessionEvent: jest.fn(),
  })),
}));

jest.mock('../../.opencode/plugins/features/audit/script-recorder', () => ({
  createScriptRecorder: jest.fn(() => ({
    logScript: jest.fn(),
  })),
}));

jest.mock('../../.opencode/plugins/features/audit/error-recorder', () => ({
  createErrorRecorder: jest.fn(() => ({
    logError: jest.fn(),
  })),
}));

describe('Audit Plugin Integration', () => {
  beforeEach(() => {
    jest.resetModules();
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
