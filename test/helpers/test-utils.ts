import { vi } from 'vitest';
import { join } from 'path';

export function mockLogFile(
  fs: {
    existsSync: ReturnType<typeof vi.fn>;
    readdirSync: ReturnType<typeof vi.fn>;
    readFileSync: ReturnType<typeof vi.fn>;
  },
  logDirPath: string,
  content: string
): void {
  fs.existsSync.mockImplementation((path: string) => {
    if (path === logDirPath) return true;
    if (path === join(logDirPath, 'dev.log')) return true;
    return false;
  });
  fs.readdirSync.mockImplementation((path: string) => {
    if (path === logDirPath) return ['dev.log'];
    return [];
  });
  fs.readFileSync.mockImplementation((path: string) => {
    if (path === join(logDirPath, 'dev.log')) return content;
    return '';
  });
}
