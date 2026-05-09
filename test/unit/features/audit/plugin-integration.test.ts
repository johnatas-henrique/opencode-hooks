// fallow-ignore-file code-duplication
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs/promises', async () => {
  const { createFsPromisesMock } =
    await import('../../helpers/mock-fs-promises');
  const mock = createFsPromisesMock();
  return { ...mock, default: mock };
});

import fsPromises from 'fs/promises';

import {
  initAuditLogging,
  getEventRecorder,
  getScriptRecorder,
  getErrorRecorder,
  resetAuditLogging,
} from '.opencode/plugins/features/audit/plugin-integration';
import { makeAuditConfig as makeConfig } from '../../../helpers/audit-config';

describe('plugin-integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuditLogging();
  });

  describe('initAuditLogging', () => {
    it('initializes and returns a promise', async () => {
      const config = makeConfig();
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(fsPromises.appendFile).mockResolvedValue(undefined);

      const promise = initAuditLogging(config);
      expect(promise).toBeInstanceOf(Promise);
      await promise;
    });

    it('returns the same singleton on second call', async () => {
      const config = makeConfig();
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(fsPromises.appendFile).mockResolvedValue(undefined);

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
    });

    it('returns instances after init', async () => {
      const config = makeConfig();
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(fsPromises.appendFile).mockResolvedValue(undefined);

      await initAuditLogging(config);

      expect(getEventRecorder()).toBeDefined();
      expect(getScriptRecorder()).toBeDefined();
      expect(getErrorRecorder()).toBeDefined();
    });
  });

  async function initWithMocks() {
    vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
    vi.mocked(fsPromises.appendFile).mockResolvedValue(undefined);

    const config = makeConfig();
    await initAuditLogging(config);
    return { config };
  }

  describe('event recorder interaction', () => {
    it('event recorder writes to audit logger', async () => {
      await initWithMocks();

      const recorder = getEventRecorder()!;
      await recorder.logToolExecuteBefore({
        tool: 'bash',
        sessionID: 's1',
        callID: 'c1',
      });

      expect(vi.mocked(fsPromises.appendFile)).toHaveBeenCalled();
    });
  });

  describe('script recorder interaction', () => {
    it('script recorder writes to audit logger', async () => {
      await initWithMocks();

      const recorder = getScriptRecorder()!;
      await recorder.logScript(
        { script: 'test.sh', args: [] },
        { output: 'ok', error: null, exitCode: 0 }
      );

      expect(vi.mocked(fsPromises.appendFile)).toHaveBeenCalled();
    });
  });

  describe('error recorder interaction', () => {
    it('error recorder writes to audit logger', async () => {
      await initWithMocks();

      const recorder = getErrorRecorder()!;
      await recorder.logError({ message: 'test error' });

      expect(vi.mocked(fsPromises.appendFile)).toHaveBeenCalled();
    });
  });
});
