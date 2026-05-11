import { vi } from 'vitest';

export function createFsPromisesMock() {
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
}

export function createReadFilePromiseMock() {
  return { readFile: vi.fn().mockResolvedValue('') };
}
