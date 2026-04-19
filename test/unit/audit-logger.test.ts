import {
  createAuditLogger,
  createGzipFile,
} from '../../.opencode/plugins/features/audit/audit-logger';
import type { AuditConfig } from '../../.opencode/plugins/features/audit/types';
import {
  appendFile as mockedAppendFile,
  mkdir as mockedMkdir,
  readdir as mockedReaddir,
  unlink as mockedUnlink,
  stat as mockedStat,
} from 'fs/promises';

const mockGzipFile = vi.fn();

vi.mock('fs/promises', () => ({
  appendFile: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  unlink: vi.fn(),
  stat: vi.fn(),
  rename: vi.fn(),
  open: vi.fn(),
}));

describe('audit-logger', () => {
  const BASE_PATH = '/tmp/audit-test';

  const defaultConfig: AuditConfig = {
    enabled: true,
    level: 'debug',
    maxSizeMB: 10,
    maxAgeDays: 30,
    truncationKB: 10,
    files: {
      events: 'plugin-events.jsonl',
      scripts: 'plugin-scripts.jsonl',
      errors: 'plugin-errors.jsonl',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAppendFile.mockResolvedValue(undefined);
    mockedMkdir.mockResolvedValue(undefined);
    mockedReaddir.mockResolvedValue([]);
    mockedUnlink.mockResolvedValue(undefined);
    mockedStat.mockReset();
    mockGzipFile.mockReset().mockResolvedValue(undefined);
  });

  describe('writeLine', () => {
    it('should not write when disabled', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, enabled: false },
        deps: { appendFile: mockedAppendFile, mkdir: mockedMkdir },
      });
      await logger.writeLine('events', { event: 'test' });
      expect(mockedAppendFile).not.toHaveBeenCalled();
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
          mkdir: mockedMkdir,
          gzipFile: mockGzipFile,
        },
      });
      await expect(
        logger.writeLine('events', { event: 'test' })
      ).resolves.not.toThrow();
    });
  });

  describe('rotate', () => {
    it('should not call stat if stat is not provided', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: { unlink: mockedUnlink, gzipFile: mockGzipFile },
      });
      await logger.rotate('events');
      expect(mockGzipFile).toHaveBeenCalledWith(
        `${BASE_PATH}/plugin-events.jsonl`,
        expect.stringContaining('plugin-events-')
      );
    });
  });

  describe('cleanup', () => {
    it('should delete files older than maxAgeDays', async () => {
      const oldDate = Date.now() - 31 * 24 * 60 * 60 * 1000;
      mockedStat.mockResolvedValue({ size: 1024, mtimeMs: oldDate });
      mockedReaddir.mockResolvedValue(['old-file.jsonl.gz']);
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          unlink: mockedUnlink,
          stat: mockedStat,
          readdir: mockedReaddir,
        },
      });
      await logger.cleanup();
      expect(mockedUnlink).toHaveBeenCalled();
    });

    it('should not delete recent files', async () => {
      const recentDate = Date.now() - 1 * 24 * 60 * 60 * 1000;
      mockedStat.mockResolvedValue({ size: 1024, mtimeMs: recentDate });
      mockedReaddir.mockResolvedValue(['recent-file.jsonl.gz']);
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          unlink: mockedUnlink,
          stat: mockedStat,
          readdir: mockedReaddir,
        },
      });
      await logger.cleanup();
      expect(mockedUnlink).not.toHaveBeenCalled();
    });

    it('should skip non-gzip files', async () => {
      mockedReaddir.mockResolvedValue(['regular-file.jsonl', 'another.txt']);
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          unlink: mockedUnlink,
          stat: mockedStat,
          readdir: mockedReaddir,
        },
      });
      await logger.cleanup();
      expect(mockedStat).not.toHaveBeenCalled();
      expect(mockedUnlink).not.toHaveBeenCalled();
    });

    it('should not cleanup when maxAgeDays is 0', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, maxAgeDays: 0 },
        deps: { readdir: mockedReaddir, unlink: mockedUnlink },
      });
      await logger.cleanup();
      expect(mockedReaddir).not.toHaveBeenCalled();
    });

    it('should handle directory not found gracefully', async () => {
      mockedReaddir.mockRejectedValue(new Error('Directory not found'));
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: { unlink: mockedUnlink, readdir: mockedReaddir },
      });
      await expect(logger.cleanup()).resolves.not.toThrow();
    });
  });

  describe('file rotation trigger', () => {
    it('should trigger rotation when file exceeds maxSizeMB', async () => {
      const maxSizeBytes = defaultConfig.maxSizeMB * 1024 * 1024;
      mockedStat
        .mockResolvedValueOnce({ size: maxSizeBytes, mtimeMs: Date.now() })
        .mockResolvedValue({ size: 100, mtimeMs: Date.now() });
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          appendFile: mockedAppendFile,
          mkdir: mockedMkdir,
          gzipFile: mockGzipFile,
          unlink: mockedUnlink,
          stat: mockedStat,
        },
      });
      await logger.writeLine('events', { event: 'test' });
      expect(mockGzipFile).toHaveBeenCalled();
    });

    it('should not trigger rotation when file is under limit', async () => {
      mockedStat.mockResolvedValue({ size: 1024, mtimeMs: Date.now() });
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          appendFile: mockedAppendFile,
          mkdir: mockedMkdir,
          gzipFile: mockGzipFile,
          unlink: mockedUnlink,
          stat: mockedStat,
        },
      });
      await logger.writeLine('events', { event: 'test' });
      expect(mockGzipFile).not.toHaveBeenCalled();
    });
  });
});

describe('createGzipFile', () => {
  it('should create a gzip function with correct dependencies', async () => {
    const pipelineMock = vi.fn((_src, _gzip, _dest, cb) => {
      cb(null);
      return Promise.resolve();
    });
    const mockGzip = { pipe: vi.fn() };
    const mockSourceHandle = {
      createReadStream: vi.fn().mockReturnValue({ pipe: vi.fn() }),
      close: vi.fn(),
    };
    const mockDestHandle = {
      createWriteStream: vi.fn().mockReturnValue({ end: vi.fn() }),
      close: vi.fn(),
    };
    const mockOpen = vi
      .fn()
      .mockResolvedValueOnce(mockSourceHandle)
      .mockResolvedValueOnce(mockDestHandle);

    const factoryResult = createGzipFile({
      createGzip: () => mockGzip,
      open: mockOpen,
      pipeline: pipelineMock,
    });

    expect(typeof factoryResult).toBe('function');
    await factoryResult('/source/path', '/dest/path');

    expect(mockOpen).toHaveBeenCalledWith('/source/path', 'r');
    expect(mockOpen).toHaveBeenCalledWith('/dest/path', 'w');
    expect(pipelineMock).toHaveBeenCalled();
    expect(mockSourceHandle.close).toHaveBeenCalled();
    expect(mockDestHandle.close).toHaveBeenCalled();
  });

  it('should handle pipeline errors', async () => {
    const pipelineError = new Error('Pipeline error');
    const pipelineMock = vi.fn((_src, _gzip, _dest, cb) => {
      cb(pipelineError);
      return Promise.resolve();
    });

    const gzipFile = createGzipFile({
      createGzip: () => ({ pipe: vi.fn() }),
      open: vi.fn().mockResolvedValue({
        createReadStream: () => ({ pipe: vi.fn() }),
        createWriteStream: () => ({ end: vi.fn() }),
        close: vi.fn(),
      }),
      pipeline: pipelineMock,
    });

    await expect(gzipFile('/source', '/dest')).rejects.toThrow(
      'Pipeline error'
    );
  });
});
