import { describe, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { mockLogFile } from '../../helpers/test-utils';
import {
  makeMockChildProcess,
  createSpawnMock,
} from '../../helpers/mock-child-process';
import { createExecutorMock } from '../../helpers/mock-executor';
import {
  createFsPromisesMock,
  createReadFilePromiseMock,
} from '../../helpers/mock-fs-promises';

function invoke(fn: unknown, ...args: unknown[]): void {
  (fn as (...args: unknown[]) => unknown)(...args);
}

interface ChildProcessMock {
  stdout: { on: Mock };
  stderr: { on: Mock };
  stdin: { write: Mock; end: Mock };
  on: Mock;
  unref: Mock;
}

function asMockChildProcess(proc: unknown): ChildProcessMock {
  return proc as ChildProcessMock;
}

// ------------------------------------------------------------------------- //
// test-utils (mockLogFile)
// ------------------------------------------------------------------------- //
describe('mockLogFile', () => {
  it('existsSync returns true for logDirPath', () => {
    const mockFs = {
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
      readFileSync: vi.fn(),
    };
    mockLogFile(mockFs, '/tmp/logs', 'content');
    expect(mockFs.existsSync('/tmp/logs')).toBe(true);
  });

  it('existsSync returns true for join(logDirPath, dev.log)', () => {
    const mockFs = {
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
      readFileSync: vi.fn(),
    };
    mockLogFile(mockFs, '/tmp/logs', 'content');
    expect(mockFs.existsSync('/tmp/logs/dev.log')).toBe(true);
  });

  it('existsSync returns false for non-matching path', () => {
    const mockFs = {
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
      readFileSync: vi.fn(),
    };
    mockLogFile(mockFs, '/tmp/logs', 'content');
    expect(mockFs.existsSync('/other/path')).toBe(false);
  });

  it('readdirSync returns dev.log for logDirPath', () => {
    const mockFs = {
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
      readFileSync: vi.fn(),
    };
    mockLogFile(mockFs, '/tmp/logs', 'content');
    expect(mockFs.readdirSync('/tmp/logs')).toEqual(['dev.log']);
  });

  it('readdirSync returns empty array for non-matching path', () => {
    const mockFs = {
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
      readFileSync: vi.fn(),
    };
    mockLogFile(mockFs, '/tmp/logs', 'content');
    expect(mockFs.readdirSync('/other/path')).toEqual([]);
  });

  it('readFileSync returns content for dev.log path', () => {
    const mockFs = {
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
      readFileSync: vi.fn(),
    };
    mockLogFile(mockFs, '/tmp/logs', 'test content');
    expect(mockFs.readFileSync('/tmp/logs/dev.log')).toBe('test content');
  });

  it('readFileSync returns empty string for non-matching path', () => {
    const mockFs = {
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
      readFileSync: vi.fn(),
    };
    mockLogFile(mockFs, '/tmp/logs', 'content');
    expect(mockFs.readFileSync('/other/path')).toBe('');
  });
});

// ------------------------------------------------------------------------- //
// mock-child-process
// ------------------------------------------------------------------------- //
describe('mock-child-process', () => {
  describe('makeMockChildProcess', () => {
    it('returns object with stdout', () => {
      expect(makeMockChildProcess().stdout).toBeDefined();
    });

    it('stdout.on is a function', () => {
      expect(typeof asMockChildProcess(makeMockChildProcess()).stdout.on).toBe(
        'function'
      );
    });

    it('stdout.on calls data callback with empty buffer', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      const callback = vi.fn();
      invoke(proc.stdout.on, 'data', callback);
      expect(callback).toHaveBeenCalled();
    });

    it('stdout.on skips callback when event is not data', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      const callback = vi.fn();
      invoke(proc.stdout.on, 'error', callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it('stdout.on mockImplementationOnce with non-empty buffer', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      proc.stdout.on.mockImplementationOnce(
        (_e: string, cb: (d: Buffer) => void) => cb(Buffer.from('hello world'))
      );
      let received = '';
      const callback = vi.fn((data: Buffer) => {
        received = data.toString();
      });
      invoke(proc.stdout.on, 'data', callback);
      expect(received).toBe('hello world');
    });

    it('returns object with stderr', () => {
      expect(makeMockChildProcess().stderr).toBeDefined();
    });

    it('stderr.on is callable', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      invoke(proc.stderr.on, vi.fn());
      expect(proc.stderr.on.mock.calls.length).toBe(1);
    });

    it('returns object with stdin', () => {
      expect(makeMockChildProcess().stdin).toBeDefined();
    });

    it('stdin.write is callable', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      invoke(proc.stdin.write, 'some input');
      expect(proc.stdin.write).toHaveBeenCalledWith('some input');
    });

    it('stdin.end is callable', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      invoke(proc.stdin.end);
      expect(proc.stdin.end).toHaveBeenCalled();
    });

    it('returns object with on handler', () => {
      expect(typeof asMockChildProcess(makeMockChildProcess()).on).toBe(
        'function'
      );
    });

    it('on stores callback', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      const callback = vi.fn();
      invoke(proc.on, callback);
      expect(proc.on).toHaveBeenCalled();
    });

    it('callback invoked with exit code 0', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      const callback = vi.fn();
      invoke(proc.on, callback);
      callback(0);
      expect(callback).toHaveBeenCalledWith(0);
    });

    it('on fires close callback directly with exit code 0', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      const callback = vi.fn();
      invoke(proc.on, 'close', callback);
      expect(callback).toHaveBeenCalledWith(0);
    });

    it('callback invoked with non-zero exit code', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      const callback = vi.fn();
      invoke(proc.on, callback);
      callback(128);
      expect(callback).toHaveBeenCalledWith(128);
    });

    it('on stores multiple callbacks', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      invoke(proc.on, vi.fn());
      invoke(proc.on, vi.fn());
      expect(proc.on.mock.calls.length).toBe(2);
    });

    it('returns unref function', () => {
      expect(typeof asMockChildProcess(makeMockChildProcess()).unref).toBe(
        'function'
      );
    });

    it('unref is callable', () => {
      const proc = asMockChildProcess(makeMockChildProcess());
      invoke(proc.unref);
      expect(proc.unref.mock.calls.length).toBe(1);
    });
  });

  describe('createSpawnMock', () => {
    it('returns object with spawn property', () => {
      expect(typeof createSpawnMock().spawn).toBe('function');
    });

    it('spawn returns child process with stdout', () => {
      const s = createSpawnMock().spawn as Mock;
      expect(s('node', []).stdout).toBeDefined();
    });

    it('spawn returns child process with stderr', () => {
      const s = createSpawnMock().spawn as Mock;
      expect(s('node', []).stderr).toBeDefined();
    });

    it('spawn returns child process with stdin', () => {
      const s = createSpawnMock().spawn as Mock;
      expect(s('node', []).stdin).toBeDefined();
    });

    it('spawn returns child process with on handler', () => {
      const s = createSpawnMock().spawn as Mock;
      expect(typeof asMockChildProcess(s('node', [])).on).toBe('function');
    });

    it('spawn returns child process with unref', () => {
      const s = createSpawnMock().spawn as Mock;
      expect(typeof asMockChildProcess(s('node', [])).unref).toBe('function');
    });

    it('spawn is callable', () => {
      const s = createSpawnMock().spawn as Mock;
      invoke(s, 'node', ['script.js']);
      expect(s).toHaveBeenCalledWith('node', ['script.js']);
    });

    describe('called', () => {
      let s: Mock;
      let proc: ReturnType<typeof asMockChildProcess>;
      let callback: (...args: unknown[]) => void;

      beforeEach(() => {
        s = createSpawnMock().spawn as Mock;
        proc = asMockChildProcess(s('node', []));
        callback = vi.fn();
      });

      it('spawn process on stores callback', () => {
        invoke(proc.on, callback);
        expect(proc.on).toHaveBeenCalled();
      });

      it('spawn process callback invoked with exit code', () => {
        invoke(proc.on, callback);
        callback(0);
        expect(callback).toHaveBeenCalledWith(0);
      });
    });
  });
});

// ------------------------------------------------------------------------- //
// mock-executor
// ------------------------------------------------------------------------- //
describe('mock-executor', () => {
  describe('createExecutorMock', () => {
    it('returns object with all required properties', () => {
      const m = createExecutorMock();
      expect(m.sanitizeArg).toBeDefined();
      expect(m.validateScriptPath).toBeDefined();
      expect(m.resolveScriptPath).toBeDefined();
      expect(m.parseHookOutput).toBeDefined();
      expect(m.buildClaudeStdin).toBeDefined();
      expect(m.buildOpencodeStdin).toBeDefined();
      expect(m.executeScript).toBeDefined();
    });

    it('sanitizeArg identity by default', () => {
      const m = createExecutorMock();
      expect(m.sanitizeArg('hello')).toBe('hello');
      expect(m.sanitizeArg('with spaces')).toBe('with spaces');
    });

    it('sanitizeArg mockReturnValue', () => {
      const m = createExecutorMock();
      m.sanitizeArg.mockReturnValue('sanitized');
      expect(m.sanitizeArg('original')).toBe('sanitized');
    });

    it('validateScriptPath true by default', () => {
      expect(createExecutorMock().validateScriptPath('/any')).toBe(true);
    });

    it('validateScriptPath mockReturnValue false', () => {
      const m = createExecutorMock();
      m.validateScriptPath.mockReturnValue(false);
      expect(m.validateScriptPath('/any')).toBe(false);
    });

    it('resolveScriptPath identity by default', () => {
      expect(createExecutorMock().resolveScriptPath('/custom')).toBe('/custom');
    });

    it('resolveScriptPath mockReturnValue', () => {
      const m = createExecutorMock();
      m.resolveScriptPath.mockReturnValue('/resolved');
      expect(m.resolveScriptPath('/original')).toBe('/resolved');
    });

    it('parseHookOutput callable', () => {
      const m = createExecutorMock();
      m.parseHookOutput('{}');
      expect(m.parseHookOutput).toHaveBeenCalledWith('{}');
    });

    it('parseHookOutput undefined by default', () => {
      expect(createExecutorMock().parseHookOutput('{}')).toBeUndefined();
    });

    it('parseHookOutput mockReturnValue', () => {
      const m = createExecutorMock();
      const mock = m.parseHookOutput;
      mock.mockReturnValue({ blocked: true });
      expect(m.parseHookOutput('{}')).toEqual({ blocked: true });
    });

    it('buildClaudeStdin callable', () => {
      const m = createExecutorMock();
      m.buildClaudeStdin({});
      expect(m.buildClaudeStdin).toHaveBeenCalled();
    });

    it('buildClaudeStdin undefined by default', () => {
      expect(createExecutorMock().buildClaudeStdin({})).toBeUndefined();
    });

    it('buildClaudeStdin mockReturnValue', () => {
      const m = createExecutorMock();
      m.buildClaudeStdin.mockReturnValue('stdin-content');
      expect(m.buildClaudeStdin({})).toBe('stdin-content');
    });

    it('buildOpencodeStdin callable', () => {
      const m = createExecutorMock();
      m.buildOpencodeStdin({});
      expect(m.buildOpencodeStdin).toHaveBeenCalled();
    });

    it('buildOpencodeStdin undefined by default', () => {
      expect(createExecutorMock().buildOpencodeStdin({})).toBeUndefined();
    });

    it('buildOpencodeStdin mockReturnValue', () => {
      const m = createExecutorMock();
      m.buildOpencodeStdin.mockReturnValue('opencode-stdin');
      expect(m.buildOpencodeStdin({})).toBe('opencode-stdin');
    });

    it('executeScript resolved by default', async () => {
      const result = await createExecutorMock().executeScript({}, {});
      expect(result).toEqual({ script: '', output: '', exitCode: 0 });
    });

    it('executeScript mockResolvedValue', async () => {
      const m = createExecutorMock();
      m.executeScript.mockResolvedValue({
        script: 'test.sh',
        output: 'done',
        exitCode: 0,
      });
      const result = await m.executeScript({}, {});
      expect(result).toEqual({
        script: 'test.sh',
        output: 'done',
        exitCode: 0,
      });
    });

    it('executeScript mockRejectedValue', async () => {
      const m = createExecutorMock();
      m.executeScript.mockRejectedValue(new Error('spawn failed'));
      await expect(m.executeScript({}, {})).rejects.toThrow('spawn failed');
    });

    it('executeScript non-zero exitCode', async () => {
      const m = createExecutorMock();
      m.executeScript.mockResolvedValue({
        script: 'fail.sh',
        output: 'error',
        exitCode: 1,
      });
      const result = await m.executeScript({}, {});
      expect(result.exitCode).toBe(1);
    });
  });
});

// ------------------------------------------------------------------------- //
// mock-fs-promises
// ------------------------------------------------------------------------- //
describe('mock-fs-promises', () => {
  describe('createFsPromisesMock', () => {
    it('returns object with all required properties', () => {
      const m = createFsPromisesMock();
      expect(m.appendFile).toBeDefined();
      expect(m.mkdir).toBeDefined();
      expect(m.readdir).toBeDefined();
      expect(m.rename).toBeDefined();
      expect(m.stat).toBeDefined();
      expect(m.unlink).toBeDefined();
      expect(m.readFile).toBeDefined();
    });

    it('appendFile resolves by default', async () => {
      const m = createFsPromisesMock();
      await expect(m.appendFile('f', 'd')).resolves.toBeUndefined();
      expect(m.appendFile.mock.calls.length).toBe(1);
    });

    it('appendFile mockRejectedValue', async () => {
      const m = createFsPromisesMock();
      m.appendFile.mockRejectedValue(new Error('append failed'));
      await expect(m.appendFile('f', 'd')).rejects.toThrow('append failed');
    });

    it('mkdir resolves by default', async () => {
      const m = createFsPromisesMock();
      await expect(m.mkdir('path')).resolves.toBeUndefined();
      expect(m.mkdir.mock.calls.length).toBe(1);
    });

    it('mkdir mockRejectedValue', async () => {
      const m = createFsPromisesMock();
      m.mkdir.mockRejectedValue(new Error('mkdir failed'));
      await expect(m.mkdir('path')).rejects.toThrow('mkdir failed');
    });

    it('readdir empty array by default', async () => {
      const result = await createFsPromisesMock().readdir('/any');
      expect(result).toEqual([]);
    });

    it('readdir mockResolvedValue', async () => {
      const m = createFsPromisesMock();
      m.readdir.mockResolvedValue(['file1.ts', 'file2.ts']);
      const result = await m.readdir('/any');
      expect(result).toEqual(['file1.ts', 'file2.ts']);
    });

    it('rename resolves by default', async () => {
      const m = createFsPromisesMock();
      await expect(m.rename('old', 'new')).resolves.toBeUndefined();
      expect(m.rename.mock.calls.length).toBe(1);
    });

    it('rename mockRejectedValue', async () => {
      const m = createFsPromisesMock();
      m.rename.mockRejectedValue(new Error('rename failed'));
      await expect(m.rename('old', 'new')).rejects.toThrow('rename failed');
    });

    it('stat default stats', async () => {
      const result = await createFsPromisesMock().stat('/any');
      expect(result).toEqual({ size: 0, mtimeMs: 0 });
    });

    it('stat mockResolvedValue custom stats', async () => {
      const m = createFsPromisesMock();
      m.stat.mockResolvedValue({ size: 999, mtimeMs: 1234567890 });
      const result = await m.stat('/any');
      expect(result.size).toBe(999);
      expect(result.mtimeMs).toBe(1234567890);
    });

    it('unlink resolves by default', async () => {
      const m = createFsPromisesMock();
      await expect(m.unlink('/any')).resolves.toBeUndefined();
      expect(m.unlink.mock.calls.length).toBe(1);
    });

    it('unlink mockRejectedValue', async () => {
      const m = createFsPromisesMock();
      m.unlink.mockRejectedValue(new Error('unlink failed'));
      await expect(m.unlink('/any')).rejects.toThrow('unlink failed');
    });

    it('readFile empty string by default', async () => {
      const result = await createFsPromisesMock().readFile('/any');
      expect(result).toBe('');
    });

    it('readFile mockResolvedValue', async () => {
      const m = createFsPromisesMock();
      m.readFile.mockResolvedValue('file contents here');
      const result = await m.readFile('/any');
      expect(result).toBe('file contents here');
    });
  });

  describe('createReadFilePromiseMock', () => {
    it('returns object with readFile property', () => {
      expect(typeof createReadFilePromiseMock().readFile).toBe('function');
    });

    it('readFile empty string by default', async () => {
      expect(await createReadFilePromiseMock().readFile('/any')).toBe('');
    });

    it('readFile mockResolvedValue custom content', async () => {
      const m = createReadFilePromiseMock();
      m.readFile.mockResolvedValue('custom content');
      expect(await m.readFile('/any')).toBe('custom content');
    });

    it('readFile mockResolvedValue JSON', async () => {
      const m = createReadFilePromiseMock();
      const json = JSON.stringify({ key: 'value' });
      m.readFile.mockResolvedValue(json);
      expect(await m.readFile('/config.json')).toBe(json);
    });

    it('readFile mockRejectedValue', async () => {
      const m = createReadFilePromiseMock();
      m.readFile.mockRejectedValue(new Error('file not found'));
      await expect(m.readFile('/missing')).rejects.toThrow('file not found');
    });
  });
});
