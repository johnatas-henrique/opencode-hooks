// fallow-ignore-file code-duplication
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs/promises', async () => {
  const { createFsPromisesMock } =
    await import('../../../helpers/mock-fs-promises');
  const mock = createFsPromisesMock();
  return { ...mock, default: mock };
});

import fsPromises from 'fs/promises';

import {
  archiveFileIfNeeded,
  createAuditLogger,
} from '.opencode/plugins/features/audit/audit-logger';
import { makeAuditConfig as makeConfig } from '../../../helpers/audit-config';

describe('archiveFileIfNeeded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when file is under maxSize', async () => {
    const mockStat = vi.fn().mockResolvedValue({ size: 500 });
    const result = await archiveFileIfNeeded(
      '/tmp/log.json',
      '/tmp/archive',
      1024,
      { stat: mockStat }
    );
    expect(result).toBe(false);
  });

  it('returns false when file does not exist', async () => {
    const mockStat = vi.fn().mockRejectedValue(new Error('ENOENT'));
    const result = await archiveFileIfNeeded(
      '/tmp/nope.json',
      '/tmp/archive',
      1024,
      { stat: mockStat }
    );
    expect(result).toBe(false);
  });

  it('archives file when over maxSize', async () => {
    const mockStat = vi.fn().mockResolvedValue({ size: 2048 });
    const mockMkdir = vi.fn().mockResolvedValue(undefined);
    const mockRename = vi.fn().mockResolvedValue(undefined);
    const result = await archiveFileIfNeeded(
      '/tmp/log.json',
      '/tmp/archive',
      1024,
      {
        stat: mockStat,
        mkdir: mockMkdir,
        rename: mockRename,
      }
    );
    expect(result).toBe(true);
    expect(mockMkdir).toHaveBeenCalledWith('/tmp/archive', { recursive: true });
    expect(mockRename).toHaveBeenCalled();
  });
});

describe('createAuditLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function assertDoesNotWrite(configOverrides: Record<string, unknown>) {
    const config = makeConfig(configOverrides);
    const logger = createAuditLogger({ basePath: '/tmp', config });
    await logger.writeLine('events', { test: true });

    expect(vi.mocked(fsPromises.appendFile)).not.toHaveBeenCalled();
  }

  it('does not write when config.enabled is false', async () => {
    await assertDoesNotWrite({ enabled: false });
  });

  it('skips events when level is audit', async () => {
    await assertDoesNotWrite({ level: 'audit' });
  });

  it('writes events when level is debug', async () => {
    vi.mocked(fsPromises.appendFile).mockResolvedValue(undefined);
    const config = makeConfig({ level: 'debug' });
    const logger = createAuditLogger({ basePath: '/tmp', config });
    await logger.writeLine('events', { test: true });

    expect(vi.mocked(fsPromises.appendFile)).toHaveBeenCalled();
  });

  it('writes scripts file type', async () => {
    vi.mocked(fsPromises.appendFile).mockResolvedValue(undefined);
    const config = makeConfig();
    const logger = createAuditLogger({ basePath: '/tmp', config });
    await logger.writeLine('scripts', { script: 'test.sh' });

    expect(vi.mocked(fsPromises.appendFile)).toHaveBeenCalled();
  });

  it('calls mkdir to ensure directory', async () => {
    vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
    vi.mocked(fsPromises.appendFile).mockResolvedValue(undefined);
    const config = makeConfig();
    const logger = createAuditLogger({ basePath: '/tmp/audit', config });
    await logger.writeLine('events', {});

    expect(vi.mocked(fsPromises.mkdir)).toHaveBeenCalledWith('/tmp/audit', {
      recursive: true,
    });
  });

  it('uses custom file names from config', async () => {
    vi.mocked(fsPromises.appendFile).mockResolvedValue(undefined);
    const config = makeConfig({
      files: {
        events: 'custom-events.json',
        scripts: 'custom-scripts.json',
        errors: 'custom-errors.json',
        security: 'custom-security.json',
        debug: 'custom-debug.json',
      },
    });
    const logger = createAuditLogger({ basePath: '/tmp', config });
    await logger.writeLine('events', {});

    expect(vi.mocked(fsPromises.appendFile)).toHaveBeenCalledWith(
      '/tmp/custom-events.json',
      expect.any(String)
    );
  });

  it('queues writes sequentially per file type', async () => {
    vi.mocked(fsPromises.appendFile).mockResolvedValue(undefined);
    const config = makeConfig();
    const logger = createAuditLogger({ basePath: '/tmp', config });
    await Promise.all([
      logger.writeLine('events', { seq: 1 }),
      logger.writeLine('events', { seq: 2 }),
    ]);

    expect(vi.mocked(fsPromises.appendFile)).toHaveBeenCalledTimes(2);
  });

  it('removes old .gz files during cleanup', async () => {
    const oldDate = Date.now() - 40 * 24 * 60 * 60 * 1000;
    vi.mocked(fsPromises.readdir).mockResolvedValue([
      'old.gz',
      'new.gz',
    ] as never);
    vi.mocked(fsPromises.stat)
      .mockResolvedValueOnce({ size: 100, mtimeMs: oldDate } as never)
      .mockResolvedValueOnce({ size: 100, mtimeMs: Date.now() } as never);
    vi.mocked(fsPromises.unlink).mockResolvedValue(undefined);

    const config = makeConfig({ maxAgeDays: 30 });
    const logger = createAuditLogger({ basePath: '/tmp/cleanup', config });
    await logger.cleanup();

    expect(vi.mocked(fsPromises.unlink)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fsPromises.unlink)).toHaveBeenCalledWith(
      '/tmp/cleanup/old.gz'
    );
  });

  it('skips cleanup when maxAgeDays <= 0', async () => {
    const config = makeConfig({ maxAgeDays: 0 });
    const logger = createAuditLogger({ basePath: '/tmp', config });
    await logger.cleanup();

    expect(vi.mocked(fsPromises.readdir)).not.toHaveBeenCalled();
  });

  it('handles readdir errors gracefully during cleanup', async () => {
    vi.mocked(fsPromises.readdir).mockRejectedValue(new Error('ENOENT'));
    const config = makeConfig({ maxAgeDays: 30 });
    const logger = createAuditLogger({ basePath: '/tmp', config });

    await expect(logger.cleanup()).resolves.toBeUndefined();
  });

  it('falls through to real stat when no deps provided', async () => {
    const result = await archiveFileIfNeeded(
      '/tmp/log.json',
      '/tmp/archive',
      1024
    );
    expect(result).toBe(false);
    expect(vi.mocked(fsPromises.stat)).toHaveBeenCalled();
  });

  it('skips cleanup when deps.stat is undefined', async () => {
    vi.mocked(fsPromises.readdir).mockResolvedValue(['old.gz'] as never);
    const config = makeConfig({ maxAgeDays: 30 });
    const logger = createAuditLogger({
      basePath: '/tmp',
      config,
      deps: { stat: undefined as undefined },
    });
    await logger.cleanup();
    expect(vi.mocked(fsPromises.readdir)).not.toHaveBeenCalled();
  });

  it('skips non-.gz files during cleanup', async () => {
    vi.mocked(fsPromises.readdir).mockResolvedValue([
      'normal.log',
      'old.gz',
      'readme.txt',
    ] as never);
    const oldMtime = Date.now() - 40 * 24 * 60 * 60 * 1000;
    vi.mocked(fsPromises.stat).mockReset();
    vi.mocked(fsPromises.stat)
      .mockResolvedValueOnce({ size: 100, mtimeMs: oldMtime } as never)
      .mockResolvedValueOnce({ size: 100, mtimeMs: oldMtime } as never);
    vi.mocked(fsPromises.unlink).mockResolvedValue(undefined);
    const config = makeConfig({ maxAgeDays: 30 });
    const logger = createAuditLogger({ basePath: '/tmp', config });
    await logger.cleanup();
    expect(vi.mocked(fsPromises.unlink)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fsPromises.unlink)).toHaveBeenCalledWith('/tmp/old.gz');
  });

  it('writes with injected deps', async () => {
    const mockAppend = vi.fn().mockResolvedValue(undefined);
    const mockMkdirFn = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig();
    const logger = createAuditLogger({
      basePath: '/tmp',
      config,
      deps: {
        appendFile: mockAppend,
        mkdir: mockMkdirFn,
        stat: vi.fn().mockResolvedValue({ size: 0 }),
        readdir: vi.fn().mockResolvedValue([]),
        unlink: vi.fn().mockResolvedValue(undefined),
        rename: vi.fn().mockResolvedValue(undefined),
      },
    });
    await logger.writeLine('events', { key: 'val' });

    expect(mockAppend).toHaveBeenCalled();
    expect(mockMkdirFn).toHaveBeenCalled();
  });

  it('handles appendFile rejection gracefully', async () => {
    vi.mocked(fsPromises.appendFile).mockRejectedValue(new Error('disk full'));
    vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
    vi.mocked(fsPromises.stat).mockResolvedValue({ size: 0 } as never);
    const config = makeConfig();
    const logger = createAuditLogger({ basePath: '/tmp', config });

    await expect(
      logger.writeLine('events', { test: true })
    ).resolves.toBeUndefined();
  });
});
