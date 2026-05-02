import { createAuditLogger } from '.opencode/plugins/features/audit/audit-logger';
import type { AuditConfig } from '.opencode/plugins/types/audit';
import { vi } from 'vitest';

const {
  mockGzipFile,
  mockAppendFile,
  mockMkdir,
  mockReaddir,
  mockUnlink,
  mockStat,
  mockRename,
  mockOpen,
} = vi.hoisted(() => ({
  mockGzipFile: vi.fn(),
  mockAppendFile: vi.fn(),
  mockMkdir: vi.fn(),
  mockReaddir: vi.fn(),
  mockUnlink: vi.fn(),
  mockStat: vi.fn(),
  mockRename: vi.fn(),
  mockOpen: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  appendFile: mockAppendFile,
  mkdir: mockMkdir,
  readdir: mockReaddir,
  unlink: mockUnlink,
  stat: mockStat,
  rename: mockRename,
  open: mockOpen,
}));

describe('audit-logger', () => {
  const BASE_PATH = '/tmp/audit-test';

  const defaultConfig: AuditConfig = {
    enabled: true,
    level: 'debug',
    basePath: BASE_PATH,
    maxSizeMB: 10,
    maxAgeDays: 30,
    logTruncationKB: 10,
    maxFieldSize: 1000,
    maxArrayItems: 50,
    largeFields: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAppendFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockReaddir.mockResolvedValue([]);
    mockUnlink.mockResolvedValue(undefined);
    mockStat.mockReset();
    mockGzipFile.mockReset().mockResolvedValue(undefined);
  });

  describe('writeLine', () => {
    it('should not write when disabled', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, enabled: false },
        deps: { appendFile: mockAppendFile, mkdir: mockMkdir },
      });
      await logger.writeLine('events', { event: 'test' });
      expect(mockAppendFile).not.toHaveBeenCalled();
    });

    it.skip('should write when enabled (debug level)', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, level: 'debug', enabled: true },
        deps: { appendFile: mockAppendFile, mkdir: mockMkdir },
      });
      await logger.writeLine('events', { event: 'test' });
      expect(mockAppendFile).toHaveBeenCalled();
    });

    it('should skip events file in audit mode', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, level: 'audit', enabled: true },
        deps: { appendFile: mockAppendFile, mkdir: mockMkdir },
      });
      await logger.writeLine('events', { event: 'test' });
      expect(mockAppendFile).not.toHaveBeenCalled();
    });

    it.skip('should write to scripts file in audit mode', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, level: 'audit', enabled: true },
        deps: { appendFile: mockAppendFile, mkdir: mockMkdir },
      });
      await logger.writeLine('scripts', { script: 'test.sh' });
      expect(mockAppendFile).toHaveBeenCalled();
    });

    it.skip('should write to errors file in audit mode', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, level: 'audit', enabled: true },
        deps: { appendFile: mockAppendFile, mkdir: mockMkdir },
      });
      await logger.writeLine('errors', { error: 'Test error' });
      expect(mockAppendFile).toHaveBeenCalled();
    });

    it('should handle write errors gracefully', async () => {
      const appendFileWithError = vi
        .fn()
        .mockRejectedValue(new Error('Write failed'));
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          appendFile: appendFileWithError,
          mkdir: mockMkdir,
        },
      });
      await expect(
        logger.writeLine('events', { event: 'test' })
      ).resolves.not.toThrow();
    });

    it('should skip archive for non-archive file types', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, maxSizeMB: 1 },
        deps: { appendFile: mockAppendFile, mkdir: mockMkdir },
      });
      await logger.writeLine('security', { event: 'test' });
      expect(mockAppendFile).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should delete files older than maxAgeDays', async () => {
      const oldDate = Date.now() - 31 * 24 * 60 * 60 * 1000;
      mockStat.mockResolvedValue({ size: 1024, mtimeMs: oldDate } as never);
      mockReaddir.mockResolvedValue(['old-file.json.gz'] as never);
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          unlink: mockUnlink,
          stat: mockStat,
          readdir: mockReaddir,
        },
      });
      await logger.cleanup();
      expect(mockUnlink).toHaveBeenCalled();
    });

    it('should not delete recent files', async () => {
      const recentDate = Date.now() - 1 * 24 * 60 * 60 * 1000;
      mockStat.mockResolvedValue({
        size: 1024,
        mtimeMs: recentDate,
      } as never);
      mockReaddir.mockResolvedValue(['recent-file.json.gz'] as never);
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          unlink: mockUnlink,
          stat: mockStat,
          readdir: mockReaddir,
        },
      });
      await logger.cleanup();
      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it('should skip non-gzip files', async () => {
      mockReaddir.mockResolvedValue([
        'regular-file.json',
        'another.txt',
      ] as never);
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          unlink: mockUnlink,
          stat: mockStat,
          readdir: mockReaddir,
        },
      });
      await logger.cleanup();
      expect(mockStat).not.toHaveBeenCalled();
      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it('should not cleanup when maxAgeDays is 0', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, maxAgeDays: 0 },
        deps: { readdir: mockReaddir, unlink: mockUnlink },
      });
      await logger.cleanup();
      expect(mockReaddir).not.toHaveBeenCalled();
    });

    it.skip('should handle directory not found gracefully', async () => {
      mockReaddir.mockRejectedValue(new Error('Directory not found'));
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: { unlink: mockUnlink, readdir: mockReaddir },
      });
      await expect(logger.cleanup()).resolves.not.toThrow();
    });

    it('should skip cleanup when stat dependency is missing', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: { readdir: mockReaddir, unlink: mockUnlink, stat: undefined },
      });
      await logger.cleanup();
      expect(mockReaddir).not.toHaveBeenCalled();
    });
  });

  describe('archiveSession', () => {
    it.skip('should archive all session files', async () => {
      mockStat
        .mockResolvedValueOnce({ size: 100 } as unknown as ReturnType<
          typeof vi.fn
        >)
        .mockResolvedValueOnce({ size: 200 } as unknown as ReturnType<
          typeof vi.fn
        >)
        .mockResolvedValueOnce({ size: 300 } as unknown as ReturnType<
          typeof vi.fn
        >)
        .mockResolvedValueOnce({ size: 400 } as unknown as ReturnType<
          typeof vi.fn
        >)
        .mockResolvedValueOnce({ size: 500 } as unknown as ReturnType<
          typeof vi.fn
        >);

      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: {
          ...defaultConfig,
          sessionId: 'test-session',
          files: {
            events: 'plugin-events_{session}.json',
            scripts: 'plugin-scripts_{session}.json',
            errors: 'plugin-errors_{session}.json',
            security: 'plugin-security_{session}.json',
            debug: 'plugin-debug_{session}.json',
          },
          archiveDir: 'audit-archive',
        },
      });

      await logger.archiveSession();

      expect(mockMkdir).toHaveBeenCalledWith(`${BASE_PATH}/audit-archive`, {
        recursive: true,
      });
      expect(mockRename).toHaveBeenCalledTimes(5);
    });

    it.skip('should skip files that do not exist', async () => {
      mockStat.mockRejectedValue(new Error('ENOENT'));

      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: {
          ...defaultConfig,
          sessionId: 'test-session',
          files: {
            events: 'plugin-events_{session}.json',
            scripts: 'plugin-scripts_{session}.json',
            errors: 'plugin-errors_{session}.json',
            security: 'plugin-security_{session}.json',
            debug: 'plugin-debug_{session}.json',
          },
        },
      });

      await logger.archiveSession();

      expect(mockRename).not.toHaveBeenCalled();
    });

    it('should handle empty files', async () => {
      mockStat.mockResolvedValue({ size: 0 } as unknown as ReturnType<
        typeof vi.fn
      >);

      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: {
          ...defaultConfig,
          sessionId: 'test-session',
          files: {
            events: 'plugin-events_{session}.json',
            scripts: 'plugin-scripts_{session}.json',
            errors: 'plugin-errors_{session}.json',
            security: 'plugin-security_{session}.json',
            debug: 'plugin-debug_{session}.json',
          },
        },
      });

      await logger.archiveSession();

      expect(mockRename).not.toHaveBeenCalled();
    });

    it('should use default archiveDir when not configured', async () => {
      mockStat.mockResolvedValue({ size: 100 } as unknown as ReturnType<
        typeof vi.fn
      >);

      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: {
          ...defaultConfig,
          sessionId: 'test-session',
        },
      });

      await logger.archiveSession();

      expect(mockMkdir).toHaveBeenCalledWith(`${BASE_PATH}/audit-archive`, {
        recursive: true,
      });
    });

    it('should archive without sessionId when sessionId is empty', async () => {
      mockStat.mockResolvedValue({ size: 100 } as unknown as ReturnType<
        typeof vi.fn
      >);

      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: {
          ...defaultConfig,
          sessionId: '',
          files: {
            events: 'plugin-events_{session}.json',
            scripts: 'plugin-scripts_{session}.json',
            errors: 'plugin-errors_{session}.json',
            security: 'plugin-security_{session}.json',
            debug: 'plugin-debug_{session}.json',
          },
        },
      });

      await logger.archiveSession();

      expect(mockRename).not.toHaveBeenCalled();
    });
  });

  describe('setSessionId', () => {
    it.skip('should update sessionId when value starts with ses_', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: {
          ...defaultConfig,
          files: {
            events: 'plugin-events_{session}.json',
            scripts: 'plugin-scripts_{session}.json',
            errors: 'plugin-errors_{session}.json',
            security: 'plugin-security_{session}.json',
            debug: 'plugin-debug_{session}.json',
          },
        },
      });

      logger.setSessionId('ses_abc123');

      await logger.writeLine('events', { test: 'data' });

      expect(mockAppendFile).toHaveBeenCalledWith(
        '/tmp/audit-test/plugin-events_ses_abc123.json',
        expect.any(String)
      );
    });

    it.skip('should use sessionId from config initially', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: {
          ...defaultConfig,
          sessionId: 'ses_initial',
          files: {
            events: 'plugin-events_{session}.json',
            scripts: 'plugin-scripts_{session}.json',
            errors: 'plugin-errors_{session}.json',
            security: 'plugin-security_{session}.json',
            debug: 'plugin-debug_{session}.json',
          },
        },
      });

      await logger.writeLine('events', { test: 'data' });

      expect(mockAppendFile).toHaveBeenCalledWith(
        '/tmp/audit-test/plugin-events_ses_initial.json',
        expect.any(String)
      );
    });

    it.skip('should ignore non-ses_ values', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: {
          ...defaultConfig,
          files: {
            events: 'plugin-events_{session}.json',
            scripts: 'plugin-scripts_{session}.json',
            errors: 'plugin-errors_{session}.json',
            security: 'plugin-security_{session}.json',
            debug: 'plugin-debug_{session}.json',
          },
        },
      });

      logger.setSessionId('ses_valid');
      await logger.writeLine('events', { test: 'data1' });
      expect(mockAppendFile).toHaveBeenLastCalledWith(
        '/tmp/audit-test/plugin-events_ses_valid.json',
        expect.any(String)
      );

      logger.setSessionId('unknown');
      await logger.writeLine('events', { test: 'data2' });
      expect(mockAppendFile).toHaveBeenLastCalledWith(
        '/tmp/audit-test/plugin-events_ses_valid.json',
        expect.any(String)
      );
    });

    it.skip('should ignore msg_ values', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: {
          ...defaultConfig,
          files: {
            events: 'plugin-events_{session}.json',
            scripts: 'plugin-scripts_{session}.json',
            errors: 'plugin-errors_{session}.json',
            security: 'plugin-security_{session}.json',
            debug: 'plugin-debug_{session}.json',
          },
        },
      });

      logger.setSessionId('ses_valid');
      logger.setSessionId('msg_de0cb4c4e001sojlCORYpE12cc');

      await logger.writeLine('events', { test: 'data' });
      expect(mockAppendFile).toHaveBeenLastCalledWith(
        '/tmp/audit-test/plugin-events_ses_valid.json',
        expect.any(String)
      );
    });

    it.skip('should ignore empty string', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: {
          ...defaultConfig,
          files: {
            events: 'plugin-events_{session}.json',
            scripts: 'plugin-scripts_{session}.json',
            errors: 'plugin-errors_{session}.json',
            security: 'plugin-security_{session}.json',
            debug: 'plugin-debug_{session}.json',
          },
        },
      });

      logger.setSessionId('ses_valid');
      logger.setSessionId('');

      await logger.writeLine('events', { test: 'data' });
      expect(mockAppendFile).toHaveBeenLastCalledWith(
        '/tmp/audit-test/plugin-events_ses_valid.json',
        expect.any(String)
      );
    });

    it('should return last known sessionId via getLastKnownSessionId', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: {
          ...defaultConfig,
        },
      });

      logger.setSessionId('ses_test123');
      expect(logger.getLastKnownSessionId()).toBe('ses_test123');

      logger.setSessionId('unknown');
      expect(logger.getLastKnownSessionId()).toBe('ses_test123');
    });
  });
});

describe('archiveFileIfNeeded', () => {
  const mockMkdir = vi.fn().mockResolvedValue(undefined);
  const mockRename = vi.fn().mockResolvedValue(undefined);
  const mockStat = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('should return false if file does not exist', async () => {
    mockStat.mockRejectedValue(new Error('ENOENT'));
    const { archiveFileIfNeeded } =
      await import('.opencode/plugins/features/audit/audit-logger');
    const result = await archiveFileIfNeeded(
      '/base/test.json',
      '/archive',
      1024 * 1024,
      {
        mkdir: mockMkdir,
        rename: mockRename,
        stat: mockStat,
      }
    );
    expect(result).toBe(false);
    expect(mockMkdir).not.toHaveBeenCalled();
    expect(mockRename).not.toHaveBeenCalled();
  });

  it.skip('should return false if file is smaller than 1MB', async () => {
    mockStat.mockResolvedValue({ size: 500 * 1024 } as unknown as ReturnType<
      typeof vi.fn
    >);
    const { archiveFileIfNeeded } =
      await import('.opencode/plugins/features/audit/audit-logger');
    const result = await archiveFileIfNeeded(
      '/base/test.json',
      '/archive',
      1024 * 1024,
      {
        mkdir: mockMkdir,
        rename: mockRename,
        stat: mockStat,
      }
    );
    expect(result).toBe(false);
    expect(mockMkdir).not.toHaveBeenCalled();
    expect(mockRename).not.toHaveBeenCalled();
  });

  it('should archive file if larger than 1MB', async () => {
    mockStat.mockResolvedValue({
      size: 2 * 1024 * 1024,
    } as unknown as ReturnType<typeof vi.fn>);
    const { archiveFileIfNeeded } =
      await import('.opencode/plugins/features/audit/audit-logger');
    const result = await archiveFileIfNeeded(
      '/base/plugin-events.json',
      '/base/audit-archive',
      1024 * 1024,
      {
        mkdir: mockMkdir,
        rename: mockRename,
        stat: mockStat,
      }
    );
    expect(result).toBe(true);
    expect(mockMkdir).toHaveBeenCalledWith('/base/audit-archive', {
      recursive: true,
    });
    expect(mockRename).toHaveBeenCalledWith(
      '/base/plugin-events.json',
      expect.stringMatching(
        /plugin-events-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json/
      )
    );
  });

  it('should use default fs dependencies when deps is not provided', async () => {
    const { archiveFileIfNeeded } =
      await import('.opencode/plugins/features/audit/audit-logger');
    const result = await archiveFileIfNeeded(
      '/nonexistent/file.json',
      '/archive',
      1024 * 1024
    );
    expect(result).toBe(false);
  });
});
