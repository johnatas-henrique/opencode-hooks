vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: vi.fn().mockResolvedValue(undefined),
}));

import { runScript } from '../../.opencode/plugins/features/scripts/run-script';
import type { PluginInput } from '@opencode-ai/plugin';

describe('run-script', () => {
  let mockDollar: PluginInput['$'];

  beforeEach(() => {
    mockDollar = vi.fn((_strings: TemplateStringsArray) => {
      const result = {
        quiet: vi.fn().mockReturnValue({
          text: vi.fn().mockReturnValue('script output'),
          exitCode: 0,
        }),
      };
      return result;
    });
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
    mockDollar = vi.fn((_strings: TemplateStringsArray) => {
      return {
        quiet: vi.fn().mockImplementation(() => {
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
