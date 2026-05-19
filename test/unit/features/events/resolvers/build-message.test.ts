import { describe, it, expect } from 'vitest';
import { buildToastMessage } from '.opencode/plugins/features/events/resolvers/build-message';
import type { ToastOverride } from '.opencode/plugins/types/config';

describe('buildToastMessage', () => {
  it('returns fallbackMessage when toastCfg is null', () => {
    const result = buildToastMessage(null, 'fallback', {});
    expect(result).toBe('fallback');
  });

  it('returns toastCfg.message when messageFn is not provided', () => {
    const toastCfg: ToastOverride = { message: 'custom message' };
    const result = buildToastMessage(toastCfg, 'fallback', {});
    expect(result).toBe('custom message');
  });

  it('uses messageFn result when it returns a value', () => {
    const toastCfg: ToastOverride = {
      messageFn: (input: Record<string, unknown>) =>
        `Dynamic: ${input.tool as string}`,
    };
    const result = buildToastMessage(toastCfg, 'fallback', { tool: 'bash' });
    expect(result).toBe('Dynamic: bash');
  });

  it('falls back to toastCfg.message when messageFn returns undefined', () => {
    const toastCfg: ToastOverride = {
      message: 'static',
      messageFn: () => undefined,
    };
    const result = buildToastMessage(toastCfg, 'fallback', {});
    expect(result).toBe('static');
  });

  it('falls back to fallbackMessage when messageFn returns undefined and no toastCfg.message', () => {
    const toastCfg: ToastOverride = {
      messageFn: () => undefined,
    };
    const result = buildToastMessage(toastCfg, 'fallback', {});
    expect(result).toBe('fallback');
  });

  it('passes output to messageFn', () => {
    const toastCfg: ToastOverride = {
      messageFn: (
        _input: Record<string, unknown>,
        output?: Record<string, unknown>
      ) => `Output: ${output?.status as string}`,
    };
    const result = buildToastMessage(
      toastCfg,
      'fallback',
      {},
      { status: 'ok' }
    );
    expect(result).toBe('Output: ok');
  });
});
