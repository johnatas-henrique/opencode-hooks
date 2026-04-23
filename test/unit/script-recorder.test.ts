import {
  createScriptRecord,
  truncateOutput,
  createScriptRecorder,
} from '../../.opencode/plugins/features/audit/script-recorder';
import type { AuditConfig } from '../../.opencode/plugins/types/audit';

describe('script-recorder', () => {
  const defaultConfig: AuditConfig = {
    enabled: true,
    level: 'debug',
    basePath: '/tmp/audit-test',
    maxSizeMB: 10,
    maxAgeDays: 30,
    truncationKB: 10,
    maxFieldSize: 1000,
    maxArrayItems: 50,
    largeFields: [],
  };

  describe('truncateOutput', () => {
    it('should skip to next line when truncation finds newline nearby', () => {
      const padding = 'x'.repeat(10800);
      const content = 'y'.repeat(10200);
      const output = padding + '\n' + content;
      const result = truncateOutput(output, 10);
      expect(result.startsWith('y')).toBe(true);
    });
  });

  describe('createScriptRecord', () => {
    it('should truncate output for .sh scripts', () => {
      const input = { script: 'build.sh' };
      const longOutput = 'x'.repeat(20 * 1024);
      const result = { output: longOutput, error: null, exitCode: 0 };

      const record = createScriptRecord(input, result, true);

      expect(record!.output!.length).toBe(10 * 1024);
    });

    it('should not truncate output for non-.sh scripts', () => {
      const input = { script: 'deploy' };
      const longOutput = 'x'.repeat(20 * 1024);
      const result = { output: longOutput, error: null, exitCode: 0 };

      const record = createScriptRecord(input, result, true);

      expect(record!.output!.length).toBe(20 * 1024);
    });

    it('should use empty args when not provided', () => {
      const input = { script: 'test.sh' };
      const result = { output: '', error: null, exitCode: 0 };

      const record = createScriptRecord(input, result, true);

      expect(record!.args).toEqual([]);
    });
  });

  describe('createScriptRecorder', () => {
    it('should not call writeLine when disabled', async () => {
      const mockWriteLine = vi.fn();
      const deps = { writeLine: mockWriteLine };
      const config = { ...defaultConfig, enabled: false };
      const recorder = createScriptRecorder(config, deps);

      await recorder.logScript(
        { script: 'test.sh' },
        { output: 'ok', error: null, exitCode: 0 }
      );

      expect(mockWriteLine).not.toHaveBeenCalled();
    });
  });
});
