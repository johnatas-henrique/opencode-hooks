import {
  createScriptRecord,
  shouldLogScripts,
  truncateOutput,
  createScriptRecorder,
} from '../../.opencode/plugins/features/audit/script-recorder';
import type { AuditConfig } from '../../.opencode/plugins/types/audit';

describe('script-recorder', () => {
  const defaultConfig: AuditConfig = {
    enabled: true,
    level: 'debug',
    maxSizeMB: 10,
    maxAgeDays: 30,
    truncationKB: 10,
    files: {
      events: 'plugin-events.jsonl',
      scripts: 'plugin-scripts.jsonl',
      errors: 'plugin-errors.jsonl',
    },
  };

  describe('shouldLogScripts', () => {
    it('should return true when enabled', () => {
      expect(shouldLogScripts(defaultConfig)).toBe(true);
    });

    it('should return false when disabled', () => {
      const config = { ...defaultConfig, enabled: false };
      expect(shouldLogScripts(config)).toBe(false);
    });
  });

  describe('truncateOutput', () => {
    it('should return output as-is when under limit', () => {
      const output = 'short output';
      expect(truncateOutput(output, 10)).toBe(output);
    });

    it('should truncate from beginning when over limit', () => {
      const output = 'a'.repeat(20 * 1024);
      const result = truncateOutput(output, 10);
      expect(result.length).toBe(10 * 1024);
      expect(result).toBe('a'.repeat(10 * 1024));
    });

    it('should skip to next line when truncation finds newline nearby', () => {
      const padding = 'x'.repeat(10800);
      const content = 'y'.repeat(10200);
      const output = padding + '\n' + content;
      const result = truncateOutput(output, 10);
      expect(result.startsWith('y')).toBe(true);
    });

    it('should keep truncation when newline is far in truncated (>100 chars)', () => {
      const padding = 'x'.repeat(11000);
      const output = padding + '\n' + 'y'.repeat(10000);
      const result = truncateOutput(output, 10);
      expect(result.startsWith('x')).toBe(true);
    });

    it('should use default truncation of 10KB', () => {
      const output = 'x'.repeat(20 * 1024);
      const result = truncateOutput(output);
      expect(result.length).toBe(10 * 1024);
    });
  });

  describe('createScriptRecord', () => {
    it('should return null when shouldLog is false', () => {
      const input = { script: 'test.sh', args: ['arg1'] };
      const result = { output: 'ok', error: null, exitCode: 0 };
      expect(createScriptRecord(input, result, false)).toBeNull();
    });

    it('should create record with all fields', () => {
      const startTime = Date.now() - 100;
      const input = { script: 'deploy.sh', args: ['prod'], startTime };
      const result = { output: 'Done!', error: null, exitCode: 0 };

      const record = createScriptRecord(input, result, true);

      expect(record).not.toBeNull();
      expect(record!.ts).toBeDefined();
      expect(record!.script).toBe('deploy.sh');
      expect(record!.args).toEqual(['prod']);
      expect(record!.exit).toBe(0);
      expect(record!.duration).toBeGreaterThanOrEqual(100);
      expect(record!.output).toBe('Done!');
      expect(record!.error).toBeUndefined();
    });

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

    it('should include error when present', () => {
      const input = { script: 'fail.sh' };
      const result = { output: '', error: 'Script failed', exitCode: 1 };

      const record = createScriptRecord(input, result, true);

      expect(record!.error).toBe('Script failed');
      expect(record!.exit).toBe(1);
    });

    it('should use empty args when not provided', () => {
      const input = { script: 'test.sh' };
      const result = { output: '', error: null, exitCode: 0 };

      const record = createScriptRecord(input, result, true);

      expect(record!.args).toEqual([]);
    });
  });

  describe('createScriptRecorder', () => {
    it('should create recorder with logScript function', () => {
      const mockWriteLine = jest.fn();
      const deps = { writeLine: mockWriteLine };
      const recorder = createScriptRecorder(defaultConfig, deps);

      expect(recorder.logScript).toBeDefined();
    });

    it('should call writeLine with correct fileType when logging', async () => {
      const mockWriteLine = jest.fn().mockResolvedValue(undefined);
      const deps = { writeLine: mockWriteLine };
      const recorder = createScriptRecorder(defaultConfig, deps);

      await recorder.logScript(
        { script: 'test.sh', args: ['arg1'] },
        { output: 'ok', error: null, exitCode: 0 }
      );

      expect(mockWriteLine).toHaveBeenCalledWith('scripts', expect.any(Object));
    });

    it('should not call writeLine when disabled', async () => {
      const mockWriteLine = jest.fn();
      const deps = { writeLine: mockWriteLine };
      const config = { ...defaultConfig, enabled: false };
      const recorder = createScriptRecorder(config, deps);

      await recorder.logScript(
        { script: 'test.sh' },
        { output: 'ok', error: null, exitCode: 0 }
      );

      expect(mockWriteLine).not.toHaveBeenCalled();
    });

    it('should pass record data to writeLine', async () => {
      const mockWriteLine = jest.fn().mockResolvedValue(undefined);
      const deps = { writeLine: mockWriteLine };
      const recorder = createScriptRecorder(defaultConfig, deps);

      await recorder.logScript(
        { script: 'deploy.sh', args: ['--prod'] },
        { output: 'Deployed!', error: null, exitCode: 0 }
      );

      const recordArg = mockWriteLine.mock.calls[0][1];
      expect(recordArg.script).toBe('deploy.sh');
      expect(recordArg.args).toEqual(['--prod']);
      expect(recordArg.exit).toBe(0);
    });
  });
});
