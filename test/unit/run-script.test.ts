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
    }) as unknown as PluginInput['$'];
  });

  describe('validateScriptPath', () => {
    it('should allow simple script name', async () => {
      const result = await runScript(
        mockDollar as PluginInput['$'],
        'test-script.sh'
      );
      expect(result.exitCode).not.toBe(-1);
    });

    it('should allow subdirectories', async () => {
      const result = await runScript(
        mockDollar as PluginInput['$'],
        'subdir/script.sh'
      );
      expect(result.error).toBeNull();
      expect(result.exitCode).toBe(0);
    });

    it('should block path traversal with /../', async () => {
      const result = await runScript(
        mockDollar as PluginInput['$'],
        '../outside.sh'
      );
      expect(result.error).toContain('Invalid script path');
      expect(result.exitCode).toBe(-1);
    });

    it('should block path traversal with /.. in middle', async () => {
      const result = await runScript(
        mockDollar as PluginInput['$'],
        'subdir/../../outside.sh'
      );
      expect(result.error).toContain('Invalid script path');
      expect(result.exitCode).toBe(-1);
    });

    it('should block absolute Unix path', async () => {
      const result = await runScript(
        mockDollar as PluginInput['$'],
        '/absolute/path.sh'
      );
      expect(result.error).toContain('Invalid script path');
      expect(result.exitCode).toBe(-1);
    });

    it('should block Windows absolute path', async () => {
      const result = await runScript(
        mockDollar as PluginInput['$'],
        'C:\\Windows\\script.bat'
      );
      expect(result.error).toContain('Invalid script path');
      expect(result.exitCode).toBe(-1);
    });

    it('should block backslash (Windows separator)', async () => {
      const result = await runScript(
        mockDollar as PluginInput['$'],
        'subdir\\script.sh'
      );
      expect(result.error).toContain('Invalid script path');
      expect(result.exitCode).toBe(-1);
    });

    it('should block empty script path', async () => {
      const result = await runScript(mockDollar as PluginInput['$'], '');
      expect(result.error).toContain('Invalid script path');
      expect(result.exitCode).toBe(-1);
    });
  });

  describe('script execution', () => {
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

    it('should return error object when script fails', async () => {
      mockDollar = vi.fn((_strings: TemplateStringsArray) => {
        return {
          quiet: vi.fn().mockImplementation(() => {
            throw new Error('Script execution failed');
          }),
        };
      }) as unknown as PluginInput['$'];

      const result = await runScript(
        mockDollar as PluginInput['$'],
        'failing.sh'
      );

      expect(result.error).toContain('Script execution failed');
      expect(result.exitCode).toBe(-1);
    });

    it('should handle non-Error objects in catch block', async () => {
      mockDollar = vi.fn((_strings: TemplateStringsArray) => {
        return {
          quiet: vi.fn().mockImplementation(() => {
            throw 'string error';
          }),
        };
      }) as unknown as PluginInput['$'];

      const result = await runScript(
        mockDollar as PluginInput['$'],
        'string-error.sh'
      );

      expect(result.error).toBe('string error');
      expect(result.exitCode).toBe(-1);
    });
  });
});
