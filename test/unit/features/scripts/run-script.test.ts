import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fromAny } from '@total-typescript/shoehorn';
import { runScript } from '.opencode/plugins/features/scripts/run-script';
import type { PluginInput } from '@opencode-ai/plugin';

type ShellFn = PluginInput['$'];

async function testRunScript(script: string, ...args: string[]) {
  const $ = fromAny<ShellFn, ReturnType<typeof vi.fn>>(vi.fn());
  return runScript($, script, ...args);
}

async function runWithResult(
  output: { text: () => string; exitCode: number },
  ...args: string[]
) {
  const mockQuiet = vi.fn().mockResolvedValue(output);
  const $ = fromAny<ShellFn, ReturnType<typeof vi.fn>>(
    vi.fn().mockReturnValue({ quiet: mockQuiet })
  );
  return { result: await runScript($, 'test.sh', ...args), mockQuiet, $ };
}

async function runWithError(error: unknown) {
  const mockQuiet = vi.fn().mockRejectedValue(error);
  const $ = fromAny<ShellFn, ReturnType<typeof vi.fn>>(
    vi.fn().mockReturnValue({ quiet: mockQuiet })
  );
  return { result: await runScript($, 'test.sh'), mockQuiet, $ };
}

describe('runScript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error for invalid script path (empty)', async () => {
    const result = await testRunScript('');
    expect(result.exitCode).toBe(-1);
    expect(result.error).toContain('Invalid script path');
  });

  it('returns error for path with .. traversal', async () => {
    const result = await testRunScript('../escape.sh');
    expect(result.exitCode).toBe(-1);
    expect(result.error).toContain('Invalid script path');
  });

  it('returns error for absolute path', async () => {
    const result = await testRunScript('/etc/hooks.sh');
    expect(result.exitCode).toBe(-1);
    expect(result.error).toContain('Invalid script path');
  });

  it('calls $`...`.quiet() with correct path for valid scripts', async () => {
    const { result, mockQuiet, $ } = await runWithResult({
      text: () => 'output',
      exitCode: 0,
    });
    expect($).toHaveBeenCalledWith(
      ['./', '/', ''],
      '.opencode/scripts',
      'test.sh'
    );
    expect(mockQuiet).toHaveBeenCalledOnce();
    expect(result).toEqual({ output: 'output', error: null, exitCode: 0 });
  });

  it('passes sanitized args to $ template', async () => {
    const { mockQuiet, $ } = await runWithResult(
      { text: () => 'done', exitCode: 0 },
      '--flag',
      'value'
    );

    expect($).toHaveBeenCalled();
    expect(mockQuiet).toHaveBeenCalledOnce();
  });

  it('handles script errors by catching and returning error result', async () => {
    const { result } = await runWithError(new Error('command not found'));

    expect(result.exitCode).toBe(-1);
    expect(result.error).toBe('command not found');
    expect(result.output).toBe('');
  });

  it('handles non-Error thrown values', async () => {
    const { result } = await runWithError('string error');

    expect(result.exitCode).toBe(-1);
    expect(result.error).toBe('string error');
  });

  it('returns success with non-zero exitCode from $ result', async () => {
    const { result } = await runWithResult({
      text: () => 'something failed',
      exitCode: 1,
    });

    expect(result.exitCode).toBe(1);
    expect(result.error).toBeNull();
    expect(result.output).toBe('something failed');
  });

  it('rejects Windows-style absolute paths', async () => {
    const result = await testRunScript('C:\\scripts\\test.sh');
    expect(result.exitCode).toBe(-1);
    expect(result.error).toContain('Invalid script path');
  });

  it('rejects paths with backslashes', async () => {
    const result = await testRunScript('subdir\\test.sh');
    expect(result.exitCode).toBe(-1);
    expect(result.error).toContain('Invalid script path');
  });
});
