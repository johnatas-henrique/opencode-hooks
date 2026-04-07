import { runScript } from '../../.opencode/plugins/helpers/run-script';

jest.mock('../../.opencode/plugins/helpers/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

describe('run-script', () => {
  let mockDollar: any;

  beforeEach(() => {
    mockDollar = jest.fn((_strings: any) => {
      const result = {
        quiet: jest.fn().mockReturnValue({
          text: jest.fn().mockReturnValue('script output'),
        }),
      };
      return result;
    });
  });

  it('should run script without arguments', async () => {
    const result = await runScript(mockDollar as any, 'test-script.sh');

    expect(mockDollar).toHaveBeenCalled();
    expect(result).toBe('script output');
  });

  it('should run script with arguments', async () => {
    const result = await runScript(
      mockDollar as any,
      'test-script.sh',
      'arg1',
      'arg2'
    );

    expect(mockDollar).toHaveBeenCalled();
    expect(result).toBe('script output');
  });

  it('should return output text from script', async () => {
    const customResult = 'custom output';
    mockDollar = jest.fn((_strings: any) => {
      return {
        quiet: jest.fn().mockReturnValue({
          text: jest.fn().mockReturnValue(customResult),
        }),
      };
    });

    const result = await runScript(mockDollar as any, 'test-script.sh');

    expect(result).toBe(customResult);
  });

  it('should throw error for invalid script path with ..', async () => {
    await expect(
      runScript(mockDollar as any, '../malicious.sh')
    ).rejects.toThrow('Invalid script path');
  });

  it('should throw error for invalid script path starting with /', async () => {
    await expect(runScript(mockDollar as any, '/etc/passwd')).rejects.toThrow(
      'Invalid script path'
    );
  });

  it('should throw error for empty script path', async () => {
    await expect(runScript(mockDollar as any, '')).rejects.toThrow(
      'Invalid script path'
    );
  });

  it('should throw error and log when script fails', async () => {
    mockDollar = jest.fn((_strings: any) => {
      return {
        quiet: jest.fn().mockImplementation(() => {
          throw new Error('Script execution failed');
        }),
      };
    });

    await expect(runScript(mockDollar as any, 'failing.sh')).rejects.toThrow(
      'Script execution failed'
    );
  });
});
