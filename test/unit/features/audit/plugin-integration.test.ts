import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFs = vi.hoisted(() => {
  const asyncFn = () => vi.fn().mockResolvedValue(undefined);
  return {
    appendFile: asyncFn(),
    mkdir: asyncFn(),
    readdir: vi.fn().mockResolvedValue([] as string[]),
    rename: asyncFn(),
    stat: vi.fn().mockResolvedValue({ size: 0, mtimeMs: 0 }),
    unlink: asyncFn(),
    readFile: vi.fn().mockResolvedValue(''),
  };
});
vi.mock('fs/promises', () => mockFs);

import {
  initAuditLogging,
  getEventRecorder,
  getScriptRecorder,
  getErrorRecorder,
  getAuditLogger,
  resetAuditLogging,
} from '.opencode/plugins/features/audit/plugin-integration';
import type { AuditConfig } from '.opencode/plugins/types/audit';

function makeConfig(overrides: Partial<AuditConfig> = {}): AuditConfig {
  return {
    enabled: true,
    level: 'debug',
    basePath: '/tmp/test-audit',
    maxSizeMB: 1,
    maxAgeDays: 30,
    logTruncationKB: 10,
    maxFieldSize: 1000,
    maxArrayItems: 50,
    largeFields: ['output'],
    ...overrides,
  };
}

describe('plugin-integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuditLogging();
  });

  describe('initAuditLogging', () => {
    it('initializes and returns a promise', async () => {
      const config = makeConfig();
      vi.mocked(mockFs.mkdir).mockResolvedValue(undefined);
      vi.mocked(mockFs.appendFile).mockResolvedValue(undefined);

      const promise = initAuditLogging(config);
      expect(promise).toBeInstanceOf(Promise);
      await promise;
    });

    it('returns the same singleton on second call', async () => {
      const config = makeConfig();
      vi.mocked(mockFs.mkdir).mockResolvedValue(undefined);
      vi.mocked(mockFs.appendFile).mockResolvedValue(undefined);

      const first = initAuditLogging(config);
      const second = initAuditLogging(config);
      expect(first).toBe(second);
      await first;
    });
  });

  describe('get* accessors', () => {
    it('returns undefined for all getters before init', () => {
      expect(getEventRecorder()).toBeUndefined();
      expect(getScriptRecorder()).toBeUndefined();
      expect(getErrorRecorder()).toBeUndefined();
      expect(getAuditLogger()).toBeUndefined();
    });

    it('returns instances after init', async () => {
      const config = makeConfig();
      vi.mocked(mockFs.mkdir).mockResolvedValue(undefined);
      vi.mocked(mockFs.appendFile).mockResolvedValue(undefined);

      await initAuditLogging(config);

      expect(getEventRecorder()).toBeDefined();
      expect(getScriptRecorder()).toBeDefined();
      expect(getErrorRecorder()).toBeDefined();
      expect(getAuditLogger()).toBeDefined();
    });
  });

  describe('resetAuditLogging', () => {
    it('clears state so getters return undefined again', async () => {
      const config = makeConfig();
      vi.mocked(mockFs.mkdir).mockResolvedValue(undefined);
      vi.mocked(mockFs.appendFile).mockResolvedValue(undefined);

      await initAuditLogging(config);
      expect(getEventRecorder()).toBeDefined();

      resetAuditLogging();
      expect(getEventRecorder()).toBeUndefined();
    });

    it('allows re-init after reset', async () => {
      const config = makeConfig();
      vi.mocked(mockFs.mkdir).mockResolvedValue(undefined);
      vi.mocked(mockFs.appendFile).mockResolvedValue(undefined);

      await initAuditLogging(config);
      resetAuditLogging();

      const promise = initAuditLogging(config);
      await promise;
      expect(getEventRecorder()).toBeDefined();
    });
  });

  describe('event recorder interaction', () => {
    it('event recorder writes to audit logger', async () => {
      vi.mocked(mockFs.mkdir).mockResolvedValue(undefined);
      vi.mocked(mockFs.appendFile).mockResolvedValue(undefined);

      const config = makeConfig();
      await initAuditLogging(config);

      const recorder = getEventRecorder()!;
      await recorder.logToolExecuteBefore({
        tool: 'bash',
        sessionID: 's1',
        callID: 'c1',
      });

      expect(mockFs.appendFile).toHaveBeenCalled();
    });
  });

  describe('script recorder interaction', () => {
    it('script recorder writes to audit logger', async () => {
      vi.mocked(mockFs.mkdir).mockResolvedValue(undefined);
      vi.mocked(mockFs.appendFile).mockResolvedValue(undefined);

      const config = makeConfig();
      await initAuditLogging(config);

      const recorder = getScriptRecorder()!;
      await recorder.logScript(
        { script: 'test.sh', args: [] },
        { output: 'ok', error: null, exitCode: 0 }
      );

      expect(mockFs.appendFile).toHaveBeenCalled();
    });
  });

  describe('error recorder interaction', () => {
    it('error recorder writes to audit logger', async () => {
      vi.mocked(mockFs.mkdir).mockResolvedValue(undefined);
      vi.mocked(mockFs.appendFile).mockResolvedValue(undefined);

      const config = makeConfig();
      await initAuditLogging(config);

      const recorder = getErrorRecorder()!;
      await recorder.logError({ message: 'test error' });

      expect(mockFs.appendFile).toHaveBeenCalled();
    });
  });
});
