import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeData, handleDebugLog } from '.opencode/plugins/core/debug';
import {
  initGlobalToastQueue,
  resetGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';
import { setDebugRecorder } from '.opencode/plugins/features/audit/debug-recorder';
import { DEFAULTS } from '.opencode/plugins/core/constants';
import type { DebugRecorder } from '.opencode/plugins/types/audit';

describe('sanitizeData', () => {
  it('returns null when data is null', () => {
    expect(sanitizeData(null)).toBeNull();
  });

  it('returns undefined when data is undefined', () => {
    expect(sanitizeData(undefined)).toBeUndefined();
  });

  it('returns primitive values unchanged', () => {
    expect(sanitizeData('hello')).toBe('hello');
    expect(sanitizeData(42)).toBe(42);
    expect(sanitizeData(true)).toBe(true);
  });

  it('redacts sensitive keys in objects', () => {
    const result = sanitizeData({
      password: 'secret123',
      name: 'john',
    }) as Record<string, unknown>;
    expect(result.password).toBe('[REDACTED]');
    expect(result.name).toBe('john');
  });

  it('redacts all known sensitive key patterns', () => {
    const keys = [
      'password',
      'token',
      'secret',
      'apiKey',
      'api_key',
      'auth',
      'credentials',
      'authorization',
      'privateKey',
      'private_key',
      'accessToken',
      'access_token',
    ];
    const input: Record<string, string> = {};
    for (const key of keys) {
      input[key] = 'sensitive-value';
    }
    const result = sanitizeData(input) as Record<string, string>;
    for (const key of keys) {
      expect(result[key]).toBe('[REDACTED]');
    }
  });

  it('redacts keys case-insensitively', () => {
    const result = sanitizeData({
      PASSWORD: 'secret',
      ApiKey: 'abc',
    }) as Record<string, unknown>;
    expect(result.PASSWORD).toBe('[REDACTED]');
    expect(result.ApiKey).toBe('[REDACTED]');
  });

  it('handles nested objects', () => {
    const result = sanitizeData({
      user: { token: 'abc', name: 'john' },
    }) as Record<string, unknown>;
    const nested = result.user as Record<string, unknown>;
    expect(nested.token).toBe('[REDACTED]');
    expect(nested.name).toBe('john');
  });

  it('processes arrays recursively', () => {
    const result = sanitizeData([
      { password: 'abc' },
      { name: 'john' },
    ]) as Array<Record<string, unknown>>;
    expect(result[0].password).toBe('[REDACTED]');
    expect(result[1].name).toBe('john');
  });

  it('handles arrays nested in objects', () => {
    const input = { items: [{ secret: 'xyz' }, { value: 'ok' }], name: 'test' };
    const result = sanitizeData(input) as Record<string, unknown>;
    const items = result.items as Array<Record<string, unknown>>;
    expect(items[0].secret).toBe('[REDACTED]');
    expect(items[1].value).toBe('ok');
  });
});

describe('handleDebugLog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGlobalToastQueue();
  });

  it('creates a toast with sanitized data', async () => {
    const showFn = vi.fn();
    initGlobalToastQueue(showFn);

    const promise = handleDebugLog('2026-01-01T00:00:00.000Z', 'Test Title', {
      password: 'secret',
      name: 'test',
    });
    await promise;

    await vi.advanceTimersByTimeAsync(DEFAULTS.toast.stagger.DEFAULT + 100);

    expect(showFn).toHaveBeenCalledOnce();
    const toast = showFn.mock.calls[0][0];
    expect(toast.title).toBe('Test Title');
    expect(toast.variant).toBe('info');
    expect(toast.message).toContain('[REDACTED]');
    expect(toast.message).not.toContain('secret');
  });

  it('logs debug via recorder when available', async () => {
    const mockLogDebug = vi.fn();
    const recorder: DebugRecorder = { logDebug: mockLogDebug };
    setDebugRecorder(recorder);
    const showFn = vi.fn();
    initGlobalToastQueue(showFn);

    await handleDebugLog('2026-01-01T00:00:00.000Z', 'Debug Msg', {
      key: 'value',
    });

    expect(mockLogDebug).toHaveBeenCalledWith({
      message: 'Debug Msg',
      data: { key: 'value' },
    });
  });

  it('does not pass data to debug recorder when sanitized data is not an object', async () => {
    const mockLogDebug = vi.fn();
    const recorder: DebugRecorder = { logDebug: mockLogDebug };
    setDebugRecorder(recorder);
    const showFn = vi.fn();
    initGlobalToastQueue(showFn);

    await handleDebugLog('2026-01-01T00:00:00.000Z', 'Plain', 'just a string');

    expect(mockLogDebug).toHaveBeenCalledWith({
      message: 'Plain',
      data: undefined,
    });
  });

  it('survives when no debug recorder is set', async () => {
    const showFn = vi.fn();
    initGlobalToastQueue(showFn);

    await expect(
      handleDebugLog('2026-01-01T00:00:00.000Z', 'No Recorder', {})
    ).resolves.toBeUndefined();
  });
});
