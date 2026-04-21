import {
  archiveLogFiles,
  archiveLogFilesWithLock,
  createAuditLogger,
  createGzipFile,
} from '../../.opencode/plugins/features/audit/audit-logger';
import type { AuditConfig } from '../../.opencode/plugins/types/audit';
import { vi } from 'vitest';
import * as fsPromises from 'fs/promises';

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

const mockedAppendFile = vi.mocked(fsPromises.appendFile);
const mockedMkdir = vi.mocked(fsPromises.mkdir);
const mockedReaddir = vi.mocked(fsPromises.readdir);
const mockedUnlink = vi.mocked(fsPromises.unlink);
const mockedStat = vi.mocked(fsPromises.stat);
const mockedRename = vi.mocked(fsPromises.rename);

describe('audit-logger', () => {
  const BASE_PATH = '/tmp/audit-test';

  const defaultConfig: AuditConfig = {
    enabled: true,
    level: 'debug',
    maxSizeMB: 10,
    maxAgeDays: 30,
    truncationKB: 10,
    files: {
      events: 'plugin-events.json',
      scripts: 'plugin-scripts.json',
      errors: 'plugin-errors.json',
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

    it('should write when enabled (debug level)', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, level: 'debug', enabled: true },
        deps: { appendFile: mockedAppendFile, mkdir: mockedMkdir },
      });
      await logger.writeLine('events', { event: 'test' });
      expect(mockedAppendFile).toHaveBeenCalled();
    });

    it('should skip events file in audit mode', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, level: 'audit', enabled: true },
        deps: { appendFile: mockedAppendFile, mkdir: mockedMkdir },
      });
      await logger.writeLine('events', { event: 'test' });
      expect(mockedAppendFile).not.toHaveBeenCalled();
    });

    it('should write to scripts file in audit mode', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, level: 'audit', enabled: true },
        deps: { appendFile: mockedAppendFile, mkdir: mockedMkdir },
      });
      await logger.writeLine('scripts', { script: 'test.sh' });
      expect(mockedAppendFile).toHaveBeenCalled();
    });

    it('should write to errors file in audit mode', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: { ...defaultConfig, level: 'audit', enabled: true },
        deps: { appendFile: mockedAppendFile, mkdir: mockedMkdir },
      });
      await logger.writeLine('errors', { error: 'Test error' });
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
    it('should not call stat if stat is not provided', async () => {
      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: defaultConfig,
        deps: { unlink: mockedUnlink, gzipFile: mockGzipFile },
      });
      await logger.rotate('events');
      expect(mockGzipFile).toHaveBeenCalledWith(
        `${BASE_PATH}/plugin-events.json`,
        expect.stringContaining('plugin-events-')
      );
    });
  });

  describe('cleanup', () => {
    it('should delete files older than maxAgeDays', async () => {
      const oldDate = Date.now() - 31 * 24 * 60 * 60 * 1000;
      mockedStat.mockResolvedValue({ size: 1024, mtimeMs: oldDate } as never);
      mockedReaddir.mockResolvedValue(['old-file.json.gz'] as never);
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
      mockedStat.mockResolvedValue({
        size: 1024,
        mtimeMs: recentDate,
      } as never);
      mockedReaddir.mockResolvedValue(['recent-file.json.gz'] as never);
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
      mockedReaddir.mockResolvedValue([
        'regular-file.json',
        'another.txt',
      ] as never);
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
        .mockResolvedValueOnce({
          size: maxSizeBytes,
          mtimeMs: Date.now(),
        } as never)
        .mockResolvedValue({ size: 100, mtimeMs: Date.now() } as never);
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
      mockedStat.mockResolvedValue({
        size: 1024,
        mtimeMs: Date.now(),
      } as never);
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

  describe('getRotatePath default path', () => {
    it('should use default plugin-{fileType}.json when config.files[fileType] is undefined (line 181)', async () => {
      const customConfig = {
        enabled: true,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        files: {
          // 'events' is undefined - triggers default path
        },
      };

      // Mock stat to succeed so getRotatePath completes execution
      mockedStat.mockResolvedValue({ size: 100 } as never);

      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: customConfig as AuditConfig,
        deps: {
          appendFile: mockedAppendFile,
          mkdir: mockedMkdir,
          stat: mockedStat,
          readdir: mockedReaddir,
          unlink: mockedUnlink,
          gzipFile: mockGzipFile,
        },
      });

      await logger.rotate('events');
      // getRotatePath uses fallback `plugin-${fileType}.json` when config.files[fileType] is undefined
      expect(mockGzipFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('plugin-events-')
      );
    });

    it('should use provided config.files[fileType] when defined', async () => {
      const customConfig = {
        enabled: true,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        files: {
          events: 'custom-events.json',
        },
      };

      const logger = createAuditLogger({
        basePath: BASE_PATH,
        config: customConfig as AuditConfig,
        deps: {
          appendFile: mockedAppendFile,
          mkdir: mockedMkdir,
          stat: mockedStat,
          readdir: mockedReaddir,
          unlink: mockedUnlink,
          gzipFile: mockGzipFile,
        },
      });

      await logger.rotate('events');
      expect(mockGzipFile).toHaveBeenCalledWith(
        `${BASE_PATH}/custom-events.json`,
        expect.stringContaining('custom-events-')
      );
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

describe('archiveLogFilesWithLock', () => {
  it('should remove stale lock and acquire lock when lock is expired', async () => {
    const mockOpen = vi
      .fn()
      .mockRejectedValueOnce({ code: 'EEXIST' }) // First open fails (EEXIST)
      .mockResolvedValueOnce({ close: vi.fn() }); // Second open succeeds after unlink
    const mockUnlink = vi.fn().mockResolvedValue(undefined);
    const mockStat = vi.fn().mockResolvedValue({});
    const mockMkdir = vi.fn().mockResolvedValue(undefined);
    const mockRename = vi.fn().mockResolvedValue(undefined);
    const oldLockTime = Date.now() - 40000; // Older than 30 second timeout
    const mockReadFile = vi.fn().mockResolvedValue(`${oldLockTime}-instance`);

    await archiveLogFilesWithLock(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        open: mockOpen,
        unlink: mockUnlink,
        stat: mockStat,
        mkdir: mockMkdir,
        rename: mockRename,
        readFile: mockReadFile,
      }
    );

    expect(mockUnlink).toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalledTimes(2);
  });

  it('should skip when lock file cannot be read (catch at line 94)', async () => {
    const mockOpen = vi.fn().mockRejectedValue({ code: 'EEXIST' });
    const mockMkdir = vi.fn().mockResolvedValue(undefined);
    const mockReadFile = vi.fn().mockRejectedValue(new Error('Cannot read'));

    await archiveLogFilesWithLock(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        open: mockOpen,
        mkdir: mockMkdir,
        readFile: mockReadFile,
      }
    );
    // Should skip - caught at line 94
    expect(mockMkdir).not.toHaveBeenCalled();
  });

  it('should skip when another process holds valid lock', async () => {
    const mockOpen = vi.fn().mockRejectedValue({ code: 'EEXIST' });
    const mockMkdir = vi.fn().mockResolvedValue(undefined);
    const mockReadFile = vi
      .fn()
      .mockResolvedValue(`${Date.now()}-other-instance`);

    await archiveLogFilesWithLock(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        open: mockOpen,
        mkdir: mockMkdir,
        readFile: mockReadFile,
      }
    );
    // Should skip because lock is still valid
    expect(mockMkdir).not.toHaveBeenCalled();
  });

  it('should throw when lock acquisition fails with non-EEXIST error (line 98)', async () => {
    const nonEexistError = new Error('EPERM');
    const mockMkdir = vi.fn().mockResolvedValue(undefined);

    await expect(
      archiveLogFilesWithLock(
        '/base',
        '/archive',
        {
          events: 'events.json',
          scripts: 'scripts.json',
          errors: 'errors.json',
        },
        {
          open: vi.fn().mockRejectedValue(nonEexistError),
          mkdir: mockMkdir,
        }
      )
    ).rejects.toThrow('EPERM');
  });

  it('should handle stale lock detection edge case - skip when lockTime is NaN', async () => {
    // Covers: !isNaN(lockTime) check - when lockTime is NaN, it skips stale path
    const mockOpen = vi.fn().mockRejectedValue({ code: 'EEXIST' });
    const mockMkdir = vi.fn().mockResolvedValue(undefined);
    const mockReadFile = vi.fn().mockResolvedValue('not-a-number-instance');

    await archiveLogFilesWithLock(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        open: mockOpen,
        mkdir: mockMkdir,
        readFile: mockReadFile,
      }
    );

    // Should skip because isNaN(lockTime) is true, so stale lock branch not taken
    expect(mockMkdir).not.toHaveBeenCalled();
  });
});

describe('archiveLogFiles', () => {
  it('should use custom mkdir when provided (line 29)', async () => {
    const customMkdir = vi.fn().mockResolvedValue(undefined);
    const customRename = vi.fn().mockResolvedValue(undefined);
    const customStat = vi.fn().mockResolvedValue({ size: 1024 } as never);

    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        mkdir: customMkdir,
        rename: customRename,
        stat: customStat,
      }
    );

    expect(customMkdir).toHaveBeenCalledWith('/archive', { recursive: true });
    // Custom mkdir used instead of default - covers line 29 branch
    expect(customMkdir).toHaveBeenCalled();
  });

  it('should use custom rename when provided (line 30)', async () => {
    const customMkdir = vi.fn().mockResolvedValue(undefined);
    const customRename = vi.fn().mockResolvedValue(undefined);
    const customStat = vi.fn().mockResolvedValue({ size: 1024 } as never);

    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        mkdir: customMkdir,
        rename: customRename,
        stat: customStat,
      }
    );

    expect(customRename).toHaveBeenCalled();
  });

  it('should use custom stat when provided (line 31)', async () => {
    const customMkdir = vi.fn().mockResolvedValue(undefined);
    const customRename = vi.fn().mockResolvedValue(undefined);
    const customStat = vi.fn().mockResolvedValue({ size: 1024 } as never);

    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        mkdir: customMkdir,
        rename: customRename,
        stat: customStat,
      }
    );

    expect(customStat).toHaveBeenCalled();
  });
});

describe('archiveLogFiles', () => {
  it('should use custom mkdir when provided (line 29)', async () => {
    const customMkdir = vi.fn().mockResolvedValue(undefined);
    const customRename = vi.fn().mockResolvedValue(undefined);
    const customStat = vi.fn().mockResolvedValue({ size: 1024 } as never);

    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        mkdir: customMkdir,
        rename: customRename,
        stat: customStat,
      }
    );

    expect(customMkdir).toHaveBeenCalledWith('/archive', { recursive: true });
    expect(customMkdir).toHaveBeenCalled();
  });

  it('should use custom rename when provided (line 30)', async () => {
    const customMkdir = vi.fn().mockResolvedValue(undefined);
    const customRename = vi.fn().mockResolvedValue(undefined);
    const customStat = vi.fn().mockResolvedValue({ size: 1024 } as never);

    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        mkdir: customMkdir,
        rename: customRename,
        stat: customStat,
      }
    );

    expect(customRename).toHaveBeenCalled();
  });

  it('should use custom stat when provided (line 31)', async () => {
    const customMkdir = vi.fn().mockResolvedValue(undefined);
    const customRename = vi.fn().mockResolvedValue(undefined);
    const customStat = vi.fn().mockResolvedValue({ size: 1024 } as never);

    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        mkdir: customMkdir,
        rename: customRename,
        stat: customStat,
      }
    );

    expect(customStat).toHaveBeenCalled();
  });

  it('should use default mkdir when deps.mkdir is undefined (branch coverage)', async () => {
    const customStat = vi.fn().mockResolvedValue({ size: 1024 } as never);
    const customRename = vi.fn().mockResolvedValue(undefined);

    // Provide deps but with mkdir undefined - should fall back to default
    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        // mkdir not provided - uses default
        rename: customRename,
        stat: customStat,
      }
    );

    // Default mkdir should be used (fs.promises.mkdir mocked)
    expect(mockedMkdir).toHaveBeenCalled();
  });

  it('should use default rename when deps.rename is undefined (branch coverage)', async () => {
    const customMkdir = vi.fn().mockResolvedValue(undefined);
    const customStat = vi.fn().mockResolvedValue({ size: 1024 } as never);

    // Provide deps but with rename undefined - should fall back to default
    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        mkdir: customMkdir,
        // rename not provided - uses default
        stat: customStat,
      }
    );

    // Default rename should be used (fs.promises.rename mocked)
    expect(mockedRename).toHaveBeenCalled();
  });

  it('should use default stat when deps.stat is undefined (branch coverage)', async () => {
    const customMkdir = vi.fn().mockResolvedValue(undefined);
    const customRename = vi.fn().mockResolvedValue(undefined);

    // Provide deps but with stat undefined - should fall back to default
    await archiveLogFiles(
      '/base',
      '/archive',
      {
        events: 'events.json',
        scripts: 'scripts.json',
        errors: 'errors.json',
      },
      {
        mkdir: customMkdir,
        rename: customRename,
        // stat not provided - uses default
      }
    );

    // Default stat should be used (fs/promises.stat mocked)
    expect(mockedStat).toHaveBeenCalled();
  });
});
