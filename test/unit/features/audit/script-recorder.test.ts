import {
  shouldLogScripts,
  truncateOutput,
  createScriptRecord,
  createScriptRecorder,
} from '.opencode/plugins/features/audit/script-recorder';
import type { AuditConfig } from '.opencode/plugins/types/audit';

describe('script-recorder', () => {
  describe('shouldLogScripts', () => {
    it('returns true when enabled', () => {
      expect(shouldLogScripts({ enabled: true } as never)).toBe(true);
    });

    it('returns false when disabled', () => {
      expect(shouldLogScripts({ enabled: false } as never)).toBe(false);
    });
  });

  describe('truncateOutput', () => {
    it('returns full output when under limit', () => {
      const output = 'short output';
      const result = truncateOutput(output, 10);
      expect(result).toBe(output);
    });

    it('truncates to last maxKb bytes', () => {
      const longOutput = 'x'.repeat(20 * 1024);
      const result = truncateOutput(longOutput, 10);
      expect(result.length).toBe(10 * 1024);
    });

    it('skips to next line when newline found near start of truncated section', () => {
      const padding = 'x'.repeat(10800);
      const content = 'y'.repeat(10200);
      const output = padding + '\n' + content;
      const result = truncateOutput(output, 10);
      expect(result.startsWith('y')).toBe(true);
    });

    it('does not skip line when newline index is 0', () => {
      const padding = 'x'.repeat(10240);
      const output = padding + '\nmore';
      const result = truncateOutput(output, 10);
      expect(result.startsWith('x')).toBe(true);
    });

    it('does not skip line when newline index is beyond 100', () => {
      // Newline is 150 chars into the truncated section (> 100)
      const padding = 'x'.repeat(10090);
      const after = 'a'.repeat(150);
      const output = padding + '\n' + after;
      const result = truncateOutput(output, 10);
      expect(result.startsWith('x')).toBe(true);
    });
  });

  describe('createScriptRecord', () => {
    it('returns null when shouldLogResult is false', () => {
      const result = createScriptRecord(
        { script: 'test.sh', args: [], startTime: Date.now() },
        { output: 'ok', error: null, exitCode: 0 },
        false,
        10
      );
      expect(result).toBeNull();
    });

    it('creates record with basic fields', () => {
      const input = { script: 'test.sh', startTime: Date.now() };
      const execResult = { output: 'ok', error: null, exitCode: 0 };
      const record = createScriptRecord(input, execResult, true, 10);

      expect(record).not.toBeNull();
      expect(record!.script).toBe('test.sh');
      expect(record!.exit).toBe(0);
      expect(record!.output).toBe('ok');
    });

    it('uses empty args when not provided', () => {
      const input = { script: 'test.sh' };
      const execResult = { output: '', error: null, exitCode: 0 };
      const record = createScriptRecord(input, execResult, true, 10);
      expect(record!.args).toEqual([]);
    });

    it('truncates output for .sh scripts', () => {
      const input = { script: 'build.sh' };
      const longOutput = 'x'.repeat(20 * 1024);
      const execResult = { output: longOutput, error: null, exitCode: 0 };
      const record = createScriptRecord(input, execResult, true, 10);
      expect(record!.output!.length).toBe(10 * 1024);
    });

    it('does not truncate output for non-.sh scripts', () => {
      const input = { script: 'deploy' };
      const longOutput = 'x'.repeat(20 * 1024);
      const execResult = { output: longOutput, error: null, exitCode: 0 };
      const record = createScriptRecord(input, execResult, true, 10);
      expect(record!.output!.length).toBe(20 * 1024);
    });

    it('includes error when present', () => {
      const input = { script: 'fail.sh' };
      const execResult = { output: '', error: 'boom', exitCode: 1 };
      const record = createScriptRecord(input, execResult, true, 10);
      expect(record!.error).toBe('boom');
    });

    it('sets undefined output when empty', () => {
      const input = { script: 'empty.sh' };
      const execResult = { output: '', error: null, exitCode: 0 };
      const record = createScriptRecord(input, execResult, true, 10);
      expect(record!.output).toBeUndefined();
    });

    it('sets undefined error when null', () => {
      const input = { script: 'ok.sh' };
      const execResult = { output: 'ok', error: null, exitCode: 0 };
      const record = createScriptRecord(input, execResult, true, 10);
      expect(record!.error).toBeUndefined();
    });
  });

  describe('createScriptRecorder', () => {
    it('should not call writeLine when disabled', async () => {
      const mockWriteLine = vi.fn().mockResolvedValue(undefined);
      const deps = { writeLine: mockWriteLine };
      const config: AuditConfig = {
        enabled: false,
        level: 'debug' as const,
        basePath: '/tmp',
        maxSizeMB: 10,
        maxAgeDays: 30,
        logTruncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
        largeFields: [],
      };
      const recorder = createScriptRecorder(config, deps);

      await recorder.logScript(
        { script: 'test.sh' },
        { output: 'ok', error: null, exitCode: 0 }
      );

      expect(mockWriteLine).not.toHaveBeenCalled();
    });

    it('should call writeLine when enabled', async () => {
      const mockWriteLine = vi.fn().mockResolvedValue(undefined);
      const deps = { writeLine: mockWriteLine };
      const config: AuditConfig = {
        enabled: true,
        level: 'debug' as const,
        basePath: '/tmp',
        maxSizeMB: 10,
        maxAgeDays: 30,
        logTruncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
        largeFields: [],
      };
      const recorder = createScriptRecorder(config, deps);

      await recorder.logScript(
        { script: 'test.sh' },
        { output: 'ok', error: null, exitCode: 0 }
      );

      expect(mockWriteLine).toHaveBeenCalledWith('scripts', expect.any(Object));
    });
  });
});
