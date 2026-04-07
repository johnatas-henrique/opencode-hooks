import { saveToFile } from '../../.opencode/plugins/helpers/save-to-file';
import * as fs from 'fs/promises';

jest.mock('fs/promises', () => ({
  appendFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

const mockAppendFile = fs.appendFile as jest.MockedFunction<
  typeof fs.appendFile
>;
const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;

describe('save-to-file', () => {
  const LOG_DIR = './production/session-logs';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should save content to default log file', async () => {
    const content = 'Test content';
    await saveToFile({ content });

    expect(mockAppendFile).toHaveBeenCalledTimes(1);
    expect(mockAppendFile).toHaveBeenCalledWith(
      `${LOG_DIR}/session_events.log`,
      expect.stringContaining('Test content')
    );
  });

  it('should save content to custom filename', async () => {
    const content = 'Test content';
    const customFile = 'custom.log';
    await saveToFile({ content, filename: customFile });

    expect(mockAppendFile).toHaveBeenCalledTimes(1);
    expect(mockAppendFile).toHaveBeenCalledWith(
      `${LOG_DIR}/${customFile}`,
      expect.stringContaining('Test content')
    );
  });

  it('should trim and format content correctly', async () => {
    const content = '  Test  content  \n  with  spaces  ';
    await saveToFile({ content });

    expect(mockAppendFile).toHaveBeenCalledWith(
      `${LOG_DIR}/session_events.log`,
      expect.stringContaining('Test')
    );
  });

  it('should show toast on filesystem error', async () => {
    const mockShowToast = jest.fn();
    (fs.appendFile as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));

    await saveToFile({ content: 'test', showToast: mockShowToast });

    expect(mockShowToast).toHaveBeenCalledWith({
      title: '====SAVE TO FILE ERROR====',
      message: 'Disk full',
      variant: 'error',
      duration: 5000,
    });
  });

  it('should not throw on filesystem error', async () => {
    (fs.appendFile as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));

    await expect(saveToFile({ content: 'test' })).resolves.not.toThrow();
  });

  it('should create directory once and cache (performance optimization)', async () => {
    expect(mockMkdir).not.toHaveBeenCalled();
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
});
