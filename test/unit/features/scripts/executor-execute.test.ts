import { executeScript } from '.opencode/plugins/features/scripts/executor';
import { spawn } from 'child_process';
import fs from 'fs';

vi.mock('child_process', () => ({
  spawn: vi.fn(() => ({
    stdin: { write: vi.fn(), end: vi.fn() },
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn((event, cb) => {
      if (event === 'close') setTimeout(() => cb(0), 0);
    }),
    removeAllListeners: vi.fn(),
  })),
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof fs>();
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    readdirSync: vi.fn(() => []),
    readFileSync: vi.fn(() => ''),
  };
});

const mockSpawn = spawn as unknown as ReturnType<typeof vi.fn>;

describe('executor - executeScript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error for invalid script path', async () => {
    const script: ScriptEntry = { path: '../evil.sh', source: 'native' };
    const result = await executeScript(script, 'event', 'tool', {});
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('Invalid script path');
  });

  it('returns error for absolute path', async () => {
    const script: ScriptEntry = { path: '/usr/bin/test', source: 'native' };
    const result = await executeScript(script, 'event', 'tool', {});
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('Invalid script path');
  });

  it('calls spawn with resolved script path', async () => {
    const script: ScriptEntry = { path: 'test.sh', source: 'native' };
    mockSpawn.mockImplementationOnce(() => ({
      stdin: { write: vi.fn(), end: vi.fn() },
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') setTimeout(() => cb(0), 0);
      }),
      removeAllListeners: vi.fn(),
    }));

    await executeScript(script, 'session.created', '', {});

    expect(mockSpawn).toHaveBeenCalled();
    const [scriptPath] = mockSpawn.mock.calls[0];
    expect(scriptPath).toContain('test.sh');
  });

  it('passes toolName as arg for native source', async () => {
    const script: ScriptEntry = { path: 'test.sh', source: 'native' };
    mockSpawn.mockImplementationOnce(() => ({
      stdin: { write: vi.fn(), end: vi.fn() },
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'close') setTimeout(() => cb(0), 0);
      }),
      removeAllListeners: vi.fn(),
    }));

    await executeScript(script, 'tool.execute.before', 'bash', {});

    const [, args] = mockSpawn.mock.calls[0];
    expect(args).toContain('bash');
  });

  it('returns stdout on success', async () => {
    const script: ScriptEntry = { path: 'test.sh', source: 'native' };
    mockSpawn.mockImplementationOnce(() => {
      const stdout = {
        on: vi.fn((event, cb) => {
          if (event === 'data') cb(Buffer.from('hello world'));
        }),
      };
      const stderr = { on: vi.fn() };
      return {
        stdin: { write: vi.fn(), end: vi.fn() },
        stdout,
        stderr,
        on: vi.fn((event, cb) => {
          if (event === 'close') setTimeout(() => cb(0), 10);
        }),
        removeAllListeners: vi.fn(),
      };
    });

    const result = await executeScript(script, 'event', '', {});
    expect(result.output).toBe('hello world');
    expect(result.exitCode).toBe(0);
  });

  it('returns stderr on non-zero exit', async () => {
    const script: ScriptEntry = { path: 'test.sh', source: 'native' };
    mockSpawn.mockImplementationOnce(() => {
      const stdout = { on: vi.fn() };
      const stderr = {
        on: vi.fn((event, cb) => {
          if (event === 'data') cb(Buffer.from('error msg'));
        }),
      };
      return {
        stdin: { write: vi.fn(), end: vi.fn() },
        stdout,
        stderr,
        on: vi.fn((event, cb) => {
          if (event === 'close') setTimeout(() => cb(1), 10);
        }),
        removeAllListeners: vi.fn(),
      };
    });

    const result = await executeScript(script, 'event', '', {});
    expect(result.output).toContain('error msg');
    expect(result.exitCode).toBe(1);
  });

  it('handles spawn error', async () => {
    const script: ScriptEntry = { path: 'test.sh', source: 'native' };
    mockSpawn.mockImplementationOnce(() => ({
      stdin: { write: vi.fn(), end: vi.fn() },
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event, cb) => {
        if (event === 'error')
          setTimeout(() => cb(new Error('spawn failed')), 0);
      }),
      removeAllListeners: vi.fn(),
    }));

    const result = await executeScript(script, 'event', '', {});
    expect(result.output).toContain('Spawn failed');
    expect(result.exitCode).toBe(1);
  });
});
