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
    it('should append valid JSON line to file', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          appendFile: mockedAppendFile,
          mkdir: mockedMkdir,
          gzipFile: mockGzipFile,
        },
      });
      const data = { ts: '2026-04-16T18:30:33.300Z', event: 'test.event' };
      await logger.writeLine('events', data);
      expect(mockedAppendFile).toHaveBeenCalledTimes(1);
      const [filePath, content] = mockedAppendFile.mock.calls[0];
      expect(filePath).toBe(`${BASE_PATH}/plugin-events.jsonl`);
      expect(content).toBe(JSON.stringify(data) + '\n');
    });

    it('should parse each line as valid JSON', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          appendFile: mockedAppendFile,
          mkdir: mockedMkdir,
          gzipFile: mockGzipFile,
        },
      });
      await logger.writeLine('events', { event: 'event1' });
      await logger.writeLine('events', { event: 'event2' });
      expect(() => {
        JSON.parse(mockedAppendFile.mock.calls[0][1].trim());
        JSON.parse(mockedAppendFile.mock.calls[1][1].trim());
      }).not.toThrow();
    });

    it('should create directory if not exists', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          appendFile: mockedAppendFile,
          mkdir: mockedMkdir,
          gzipFile: mockGzipFile,
        },
      });
      await logger.writeLine('events', { event: 'test' });
      expect(mockedMkdir).toHaveBeenCalledWith(BASE_PATH, { recursive: true });
    });

    it('should not write when disabled', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, enabled: false },
        deps: { appendFile: mockedAppendFile, mkdir: mockedMkdir },
      });
      await logger.writeLine('events', { event: 'test' });
      expect(mockedAppendFile).not.toHaveBeenCalled();
    });

    it('should write to correct file based on type', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          appendFile: mockedAppendFile,
          mkdir: mockedMkdir,
          gzipFile: mockGzipFile,
        },
      });
      await logger.writeLine('scripts', { script: 'test.sh' });
      expect(mockedAppendFile).toHaveBeenCalledWith(
        `${BASE_PATH}/plugin-scripts.jsonl`,
        expect.any(String)
      );
      await logger.writeLine('errors', { error: 'test error' });
      expect(mockedAppendFile).toHaveBeenCalledWith(
        `${BASE_PATH}/plugin-errors.jsonl`,
        expect.any(String)
      );
    });

    it('should use default config when not provided', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        deps: { appendFile: mockedAppendFile, mkdir: mockedMkdir },
      });
      await logger.writeLine('events', { event: 'test' });
      expect(mockedAppendFile).toHaveBeenCalled();
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
    it('should create gzip file and remove original', async () => {
      mockedStat.mockResolvedValue({ size: 1024, mtimeMs: Date.now() });
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          unlink: mockedUnlink,
          gzipFile: mockGzipFile,
          stat: mockedStat,
        },
      });
      await logger.rotate('events');
      expect(mockGzipFile).toHaveBeenCalled();
      expect(mockedUnlink).toHaveBeenCalled();
    });

    it('should handle non-existent file gracefully', async () => {
      mockedStat.mockRejectedValue(new Error('File not found'));
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          unlink: mockedUnlink,
          gzipFile: mockGzipFile,
          stat: mockedStat,
        },
      });
      await logger.rotate('events');
      expect(mockGzipFile).not.toHaveBeenCalled();
      expect(mockedUnlink).not.toHaveBeenCalled();
    });

    it('should increment counter for same day rotations', async () => {
      mockedStat.mockResolvedValue({ size: 1024, mtimeMs: Date.now() });
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          unlink: mockedUnlink,
          gzipFile: mockGzipFile,
          stat: mockedStat,
        },
      });
      await logger.rotate('events');
      await logger.rotate('events');
      expect(mockGzipFile).toHaveBeenCalledTimes(2);
    });

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

    it('should handle gzipFile error during rotation gracefully', async () => {
      mockedStat.mockResolvedValue({ size: 1024, mtimeMs: Date.now() });
      mockGzipFile.mockRejectedValue(new Error('Gzip failed'));
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: {
          unlink: mockedUnlink,
          gzipFile: mockGzipFile,
          stat: mockedStat,
        },
      });
      await expect(logger.rotate('events')).resolves.not.toThrow();
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

  describe('concurrent writes', () => {
    it('should handle multiple writes to same file safely', async () => {
      const appendFile = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 10))
        );
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: { appendFile, mkdir: mockedMkdir, gzipFile: mockGzipFile },
      });
      const writes = [
        logger.writeLine('events', { event: '1' }),
        logger.writeLine('events', { event: '2' }),
        logger.writeLine('events', { event: '3' }),
      ];
      await Promise.all(writes);
      expect(appendFile).toHaveBeenCalledTimes(3);
    });

    it('should handle writes to different files independently', async () => {
      const appendFile = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 5))
        );
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: { appendFile, mkdir: mockedMkdir, gzipFile: mockGzipFile },
      });
      await Promise.all([
        logger.writeLine('events', { event: 'event' }),
        logger.writeLine('scripts', { script: 'script' }),
        logger.writeLine('errors', { error: 'error' }),
      ]);
      expect(appendFile).toHaveBeenCalledTimes(3);
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
