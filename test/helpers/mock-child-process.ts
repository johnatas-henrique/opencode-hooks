export function makeMockChildProcess(): Record<string, unknown> {
  return {
    stdout: {
      on: vi.fn((event: string, cb: (d: Buffer) => void) => {
        if (event === 'data') cb(Buffer.from(''));
      }),
    },
    stderr: { on: vi.fn() },
    stdin: { write: vi.fn(), end: vi.fn() },
    on: vi.fn((event: string, cb: (code: number) => void) => {
      if (event === 'close') cb(0);
    }),
    unref: vi.fn(),
  };
}

export function createSpawnMock(): { spawn: ReturnType<typeof vi.fn> } {
  const procFn = () => vi.fn();
  return {
    spawn: vi.fn(() => ({
      stdout: { on: procFn() },
      stderr: { on: procFn() },
      stdin: { write: procFn(), end: procFn() },
      on: procFn(),
      unref: procFn(),
    })),
  };
}
