import { getLatestLogFile } from '../../.opencode/plugins/features/messages/plugin-status';
import * as fs from 'fs';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const mockExistsSync = fs.existsSync as vi.Mock;
const mockReaddirSync = fs.readdirSync as vi.Mock;
const mockReadFileSync = fs.readFileSync as vi.Mock;

describe('getLatestLogFile coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sort dev.log to the end', () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['other.log', 'dev.log', 'another.log']);
    mockReadFileSync.mockReturnValue(JSON.stringify({ logs: [] }));

    const result = getLatestLogFile();

    // dev.log should be sorted to the end, then reverse localeCompare.
    // ['dev.log', 'other.log', 'another.log']
    // sorted by: a === 'dev.log' ? 1 : b === 'dev.log' ? -1 : b.localeCompare(a)
    // 'other.log' vs 'another.log' -> 'other' > 'another' -> 'other.log' comes first.
    // 'dev.log' always comes last.
    // result should be 'other.log'
    expect(result).toMatch(/other\.log$/);
  });
});
