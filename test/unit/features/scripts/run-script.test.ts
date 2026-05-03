import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runScript } from '.opencode/plugins/features/scripts/run-script';
import type { PluginInput } from '@opencode-ai/plugin';

describe('runScript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error for invalid script path (empty)', async () => {
    const $ = vi.fn() as unknown as PluginInput['$'];
    const result = await runScript($, '');
    expect(result.exitCode).toBe(-1);
    expect(result.error).toContain('Invalid script path');
  });

  it('returns error for path with .. traversal', async () => {
    const $ = vi.fn() as unknown as PluginInput['$'];
    const result = await runScript($, '../escape.sh');
    expect(result.exitCode).toBe(-1);
    expect(result.error).toContain('Invalid script path');
  });

  it('returns error for absolute path', async () => {
    const $ = vi.fn() as unknown as PluginInput['$'];
    const result = await runScript($, '/etc/hooks.sh');
    expect(result.exitCode).toBe(-1);
    expect(result.error).toContain('Invalid script path');
  });

  it('calls $`...`.quiet() with correct path for valid scripts', async () => {
    const mockResult = { text: () => 'output', exitCode: 0 };
    const mockQuiet = vi.fn().mockResolvedValue(mockResult);
    const $ = vi
      .fn()
      .mockReturnValue({ quiet: mockQuiet }) as unknown as PluginInput['$'];

    const result = await runScript($, 'test.sh');

    expect($).toHaveBeenCalledWith(
      ['./', '/', ''],
      '.opencode/scripts',
      'test.sh'
    );
    expect(mockQuiet).toHaveBeenCalledOnce();
    expect(result).toEqual({ output: 'output', error: null, exitCode: 0 });
  });

  it('passes sanitized args to $ template', async () => {
    const mockResult = { text: () => 'done', exitCode: 0 };
    const mockQuiet = vi.fn().mockResolvedValue(mockResult);
    const $ = vi
      .fn()
      .mockReturnValue({ quiet: mockQuiet }) as unknown as PluginInput['$'];

    await runScript($, 'test.sh', '--flag', 'value');

    expect($).toHaveBeenCalled();
    expect(mockQuiet).toHaveBeenCalledOnce();
  });

  it('handles script errors by catching and returning error result', async () => {
    const mockQuiet = vi.fn().mockRejectedValue(new Error('command not found'));
    const $ = vi
      .fn()
      .mockReturnValue({ quiet: mockQuiet }) as unknown as PluginInput['$'];

    const result = await runScript($, 'test.sh');

    expect(result.exitCode).toBe(-1);
    expect(result.error).toBe('command not found');
    expect(result.output).toBe('');
  });

  it('handles non-Error thrown values', async () => {
    const mockQuiet = vi.fn().mockRejectedValue('string error');
    const $ = vi
      .fn()
      .mockReturnValue({ quiet: mockQuiet }) as unknown as PluginInput['$'];

    const result = await runScript($, 'test.sh');

    expect(result.exitCode).toBe(-1);
    expect(result.error).toBe('string error');
  });

  it('returns success with non-zero exitCode from $ result', async () => {
    const mockResult = { text: () => 'something failed', exitCode: 1 };
    const mockQuiet = vi.fn().mockResolvedValue(mockResult);
    const $ = vi
      .fn()
      .mockReturnValue({ quiet: mockQuiet }) as unknown as PluginInput['$'];

    const result = await runScript($, 'test.sh');

    expect(result.exitCode).toBe(1);
    expect(result.error).toBeNull();
    expect(result.output).toBe('something failed');
  });
});
