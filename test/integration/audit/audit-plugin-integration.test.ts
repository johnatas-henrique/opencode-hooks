import {
  resetAuditLogging,
  getEventRecorder,
  getScriptRecorder,
  getErrorRecorder,
  getAuditLogger,
} from '.opencode/plugins/features/audit/plugin-integration';

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
    cleanup: vi.fn(),
  })),
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

describe('getAuditLogger', () => {
  it('should return undefined before initialization', () => {
    const recorder = getAuditLogger();
    expect(recorder).toBeUndefined();
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
});
