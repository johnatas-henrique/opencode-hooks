import { getLatestLogFile } from '../../.opencode/plugins/features/messages/plugin-status';
import * as fs from 'fs';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const mockExistsSync = fs.existsSync as jest.Mock;
const mockReaddirSync = fs.readdirSync as jest.Mock;
const mockReadFileSync = fs.readFileSync as jest.Mock;

describe('getLatestLogFile coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
