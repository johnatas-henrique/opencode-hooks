import type { Mock, MockedFunction } from 'vitest';
import { saveToFile } from '../../.opencode/plugins/features/persistence/save-to-file';
import * as fs from 'fs/promises';

vi.mock('fs/promises', () => ({
  appendFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

const mockAppendFile = fs.appendFile as MockedFunction<typeof fs.appendFile>;

describe('save-to-file', () => {
  const LOG_DIR = './production/session-logs';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should show toast on filesystem error', async () => {
    const mockShowToast = vi.fn();
    (fs.appendFile as Mock).mockRejectedValueOnce(new Error('Disk full'));

    await saveToFile({ content: 'test', showToast: mockShowToast });

    expect(mockShowToast).toHaveBeenCalledWith({
      title: '====SAVE TO FILE ERROR====',
      message: 'Disk full',
      variant: 'error',
      duration: 5000,
    });
  });

  it('should not throw on filesystem error', async () => {
    (fs.appendFile as Mock).mockRejectedValueOnce(new Error('Disk full'));

    await expect(saveToFile({ content: 'test' })).resolves.not.toThrow();
  });

  it('should fallback to default filename for invalid filenames', async () => {
    await saveToFile({ content: 'test', filename: 'inva<lid.log' });

    expect(mockAppendFile).toHaveBeenCalledWith(
      `${LOG_DIR}/session_events.log`,
      expect.stringContaining('test')
    );
  });

  it('should fallback to default filename for empty filename', async () => {
    await saveToFile({ content: 'test', filename: '' });

    expect(mockAppendFile).toHaveBeenCalledWith(
      `${LOG_DIR}/session_events.log`,
      expect.stringContaining('test')
    );
  });

  it('should fallback to default filename for too-long filename', async () => {
    const longName = 'a'.repeat(256) + '.log';
    await saveToFile({ content: 'test', filename: longName });

    expect(mockAppendFile).toHaveBeenCalledWith(
      `${LOG_DIR}/session_events.log`,
      expect.stringContaining('test')
    );
  });

  it('should fallback to default filename for filename with control characters', async () => {
    const invalidName = 'test\x00file.log';
    await saveToFile({ content: 'test', filename: invalidName });

    expect(mockAppendFile).toHaveBeenCalledWith(
      `${LOG_DIR}/session_events.log`,
      expect.stringContaining('test')
    );
  });
});
