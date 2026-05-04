import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  shouldLogScripts,
  truncateOutput,
  createScriptRecord,
  createScriptRecorder,
} from '.opencode/plugins/features/audit/script-recorder';
import type { AuditConfig, ScriptInput } from '.opencode/plugins/types/audit';

function makeConfig(overrides: Partial<AuditConfig> = {}): AuditConfig {
  return {
    enabled: true,
    level: 'debug',
    basePath: '/tmp/test',
    maxSizeMB: 1,
    maxAgeDays: 30,
    logTruncationKB: 10,
    maxFieldSize: 100,
    maxArrayItems: 50,
    largeFields: ['output'],
    ...overrides,
  };
}

describe('shouldLogScripts', () => {
  it('returns true when enabled', () => {
    expect(shouldLogScripts(makeConfig())).toBe(true);
  });

  it('returns false when disabled', () => {
    expect(shouldLogScripts(makeConfig({ enabled: false }))).toBe(false);
  });
});

describe('truncateOutput', () => {
  it('returns the full output when under maxKb', () => {
    const output = 'short';
    expect(truncateOutput(output, 10)).toBe('short');
  });

  it('truncates output over maxKb and finds newline boundary', () => {
    const output = 'line1\n' + 'x'.repeat(1024 * 10) + '\nline2';
    const result = truncateOutput(output, 1);
    expect(result.length).toBeLessThan(output.length);
  });

  it('returns truncated text when no newline found near start', () => {
    const output = 'a'.repeat(5000);
    const result = truncateOutput(output, 1);
    expect(result.length).toBe(1024);
  });

  it('slices from newline after truncation boundary', () => {
    const line1 = 'first line';
    const big = 'x'.repeat(1024);
    const output = line1 + '\n' + big;
    const result = truncateOutput(output, 1);
    expect(result).toBe(big);
  });

  it('slices from newline when newline is within truncated portion', () => {
    const prefix = 'a'.repeat(40);
    const suffix = 'b'.repeat(1000);
    const output = prefix + '\n' + suffix;
    const result = truncateOutput(output, 1);
    expect(result).toBe(suffix);
  });
});

describe('createScriptRecord', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('returns null when shouldLogResult is false', () => {
    const input: ScriptInput = { script: 'test.sh', args: [] };
    const result = { output: 'ok', error: null, exitCode: 0 };
    expect(createScriptRecord(input, result, false, 10)).toBeNull();
  });

  it('creates a script record with all fields', () => {
    const input: ScriptInput = {
      script: 'test.sh',
      args: ['--flag'],
      startTime: Date.now() - 1000,
    };
    const result = { output: 'done', error: null, exitCode: 0 };
    const record = createScriptRecord(input, result, true, 10);
    expect(record).not.toBeNull();
    expect(record!.script).toBe('test.sh');
    expect(record!.args).toEqual(['--flag']);
    expect(record!.exit).toBe(0);
    expect(record!.output).toBe('done');
    expect(record!.error).toBeUndefined();
    expect(record!.duration).toEqual(expect.any(Number));
  });

  it('calculates duration from startTime', () => {
    const input: ScriptInput = {
      script: 'test.sh',
      args: [],
      startTime: Date.now() - 5000,
    };
    const result = { output: 'ok', error: null, exitCode: 0 };
    const record = createScriptRecord(input, result, true, 10);
    expect(record!.duration).toBeGreaterThanOrEqual(4000);
  });

  it('sets duration undefined when startTime is not provided', () => {
    const input: ScriptInput = { script: 'test.sh', args: [] };
    const result = { output: 'ok', error: null, exitCode: 0 };
    const record = createScriptRecord(input, result, true, 10);
    expect(record!.duration).toBeUndefined();
  });

  it('handles undefined args in input', () => {
    const input: ScriptInput = { script: 'test.sh' };
    const result = { output: 'ok', error: null, exitCode: 0 };
    const record = createScriptRecord(input, result, true, 10);
    expect(record).not.toBeNull();
    expect(record!.args).toEqual([]);
  });

  it('truncates output for .sh scripts', () => {
    const input: ScriptInput = { script: 'test.sh', args: [] };
    const longOutput = 'x'.repeat(1024 * 20);
    const result = { output: longOutput, error: null, exitCode: 0 };
    const record = createScriptRecord(input, result, true, 1);
    expect(record!.output!.length).toBeLessThan(longOutput.length);
  });

  it('does not truncate output for non-.sh scripts', () => {
    const input: ScriptInput = { script: 'test.js', args: [] };
    const longOutput = 'x'.repeat(1024 * 20);
    const result = { output: longOutput, error: null, exitCode: 0 };
    const record = createScriptRecord(input, result, true, 1);
    expect(record!.output!.length).toBe(longOutput.length);
  });

  it('sets output undefined when output is empty string', () => {
    const input: ScriptInput = { script: 'test.sh', args: [] };
    const result = { output: '', error: null, exitCode: 0 };
    const record = createScriptRecord(input, result, true, 10);
    expect(record!.output).toBeUndefined();
  });

  it('includes error when present', () => {
    const input: ScriptInput = { script: 'test.sh', args: [] };
    const result = { output: '', error: 'something failed', exitCode: 1 };
    const record = createScriptRecord(input, result, true, 10);
    expect(record!.error).toBe('something failed');
  });

  it('handles null error', () => {
    const input: ScriptInput = { script: 'test.sh', args: [] };
    const result = { output: 'ok', error: null, exitCode: 0 };
    const record = createScriptRecord(input, result, true, 10);
    expect(record!.error).toBeUndefined();
  });
});

describe('createScriptRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls writeLine on logScript', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig();
    const recorder = createScriptRecorder(config, { writeLine: mockWriteLine });

    const input: ScriptInput = { script: 'test.sh', args: [] };
    await recorder.logScript(input, { output: 'ok', error: null, exitCode: 0 });

    expect(mockWriteLine).toHaveBeenCalledOnce();
    expect(mockWriteLine.mock.calls[0][0]).toBe('scripts');
  });

  it('does not call writeLine when disabled', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig({ enabled: false });
    const recorder = createScriptRecorder(config, { writeLine: mockWriteLine });

    const input: ScriptInput = { script: 'test.sh', args: [] };
    await recorder.logScript(input, { output: 'ok', error: null, exitCode: 0 });

    expect(mockWriteLine).not.toHaveBeenCalled();
  });
});
