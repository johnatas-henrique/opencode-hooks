import { saveToFile } from '../../../.opencode/plugins/helpers/save-to-file';
import * as fs from 'fs/promises';

jest.mock('fs/promises', () => ({
  appendFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

const mockAppendFile = fs.appendFile as jest.MockedFunction<
  typeof fs.appendFile
>;

describe('Property-based: save-to-file', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should always resolve without throwing for various contents', async () => {
    const contents = [
      'simple content',
      'content with spaces   ',
      '',
      'a'.repeat(1000),
      'special chars: !@#$%^&*()',
      'newlines\n\n\n',
      'unicode: áéíóú ãõ',
    ];

    for (const content of contents) {
      await expect(saveToFile({ content })).resolves.not.toThrow();
    }
  });

  it('should handle various filename lengths', async () => {
    const filenames = [
      'a.log',
      'file.log',
      'very-long-filename-that-exceeds-normal-lengths.log',
    ];

    for (const filename of filenames) {
      await expect(
        saveToFile({ content: 'test', filename })
      ).resolves.not.toThrow();
    }
  });

  it('should handle empty content', async () => {
    await expect(saveToFile({ content: '' })).resolves.not.toThrow();
  });

  it('should produce consistent output format', async () => {
    await saveToFile({ content: 'test content' });

    expect(mockAppendFile).toHaveBeenCalledWith(
      expect.stringContaining('./production/session-logs/'),
      expect.any(String)
    );
  });

  it('should append without overwriting', async () => {
    await saveToFile({ content: 'first' });
    await saveToFile({ content: 'second' });

    expect(mockAppendFile).toHaveBeenCalledTimes(2);
  });
});
