jest.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

import { runScript } from '../../.opencode/plugins/features/scripts/run-script';
import type { PluginInput } from '@opencode-ai/plugin';

describe('run-script', () => {
  let mockDollar: PluginInput['$'];

  beforeEach(() => {
    mockDollar = jest.fn((_strings: TemplateStringsArray) => {
      const result = {
        quiet: jest.fn().mockReturnValue({
          text: jest.fn().mockReturnValue('script output'),
          exitCode: 0,
        }),
      };
      return result;
    });
  });

  it('should run script without arguments', async () => {
    const result = await runScript(
      mockDollar as PluginInput['$'],
      'test-script.sh'
    );

    expect(mockDollar).toHaveBeenCalled();
    expect(result.output).toBe('script output');
    expect(result.exitCode).toBe(0);
  });

  it('should run script with arguments', async () => {
    const result = await runScript(
      mockDollar as PluginInput['$'],
      'test-script.sh',
      'arg1',
      'arg2'
    );

    expect(mockDollar).toHaveBeenCalled();
    expect(result.output).toBe('script output');
  });

  it('should return output text from script', async () => {
    const customResult = 'custom output';
    mockDollar = jest.fn((_strings: TemplateStringsArray) => {
      return {
        quiet: jest.fn().mockReturnValue({
          text: jest.fn().mockReturnValue(customResult),
          exitCode: 0,
        }),
      };
    });

    const result = await runScript(
      mockDollar as PluginInput['$'],
      'test-script.sh'
    );

    expect(result.output).toBe(customResult);
  });

  it('should return error for invalid script path with ..', async () => {
    const result = await runScript(
      mockDollar as PluginInput['$'],
      '../malicious.sh'
    );

    expect(result.error).toContain('Invalid script path');
    expect(result.exitCode).toBe(-1);
  });

  it('should return error for invalid script path starting with /', async () => {
    const result = await runScript(
      mockDollar as PluginInput['$'],
      '/etc/passwd'
    );

    expect(result.error).toContain('Invalid script path');
    expect(result.exitCode).toBe(-1);
  });

  it('should return error for empty script path', async () => {
    const result = await runScript(mockDollar as PluginInput['$'], '');

    expect(result.error).toContain('Invalid script path');
    expect(result.exitCode).toBe(-1);
  });

  it('should return error object when script fails', async () => {
    mockDollar = jest.fn((_strings: TemplateStringsArray) => {
      return {
        quiet: jest.fn().mockImplementation(() => {
          throw new Error('Script execution failed');
        }),
      };
    });

    const result = await runScript(
      mockDollar as PluginInput['$'],
      'failing.sh'
    );

    expect(result.error).toContain('Script execution failed');
    expect(result.exitCode).toBe(-1);
  });
});
