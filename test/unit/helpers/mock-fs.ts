import { vi } from 'vitest';

export function createSyncMockFs() {
  const fn = () => vi.fn();
  return {
    existsSync: fn(),
    readFileSync: fn(),
    readdirSync: fn(),
    writeFileSync: fn(),
    mkdirSync: fn(),
    unlinkSync: fn(),
    statSync: fn(),
    appendFileSync: fn(),
  };
}
