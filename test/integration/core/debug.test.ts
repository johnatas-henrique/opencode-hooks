import { handleDebugLog, sanitizeData } from '.opencode/plugins/core/debug';
import type { DebugRecorder } from '.opencode/plugins/types/audit';
import {
  TOAST_DEFAULTS,
  SCRIPTS_DEFAULTS,
  CORE_DEFAULTS,
  AUDIT_DEFAULTS,
  DISABLED_CONFIG_DEFAULTS,
} from '../../helpers/mock-defaults';

// Use vi.hoisted to isolate mocks properly - factory functions create fresh mocks per test run
const {
  mockAdd: _mockAdd,
  mockUseGlobalToastQueue,
  mockGetDebugRecorder,
} = vi.hoisted(() => {
  const mockAdd = vi.fn();
  const mockUseGlobalToastQueue = vi.fn(() => ({ add: mockAdd }));
  const mockGetDebugRecorder = vi.fn().mockReturnValue(null);
  return {
    mockAdd,
    mockUseGlobalToastQueue,
    mockGetDebugRecorder,
  };
});

vi.mock('.opencode/plugins/core/toast-queue', () => ({
  useGlobalToastQueue: mockUseGlobalToastQueue,
}));

vi.mock('.opencode/plugins/core/constants', () => ({
  DEFAULTS: {
    toast: TOAST_DEFAULTS,
    scripts: SCRIPTS_DEFAULTS,
    core: CORE_DEFAULTS,
    audit: AUDIT_DEFAULTS,
    config: {
      disabled: DISABLED_CONFIG_DEFAULTS,
    },
  },
}));

vi.mock('.opencode/plugins/features/audit/debug-recorder', () => ({
  getDebugRecorder: mockGetDebugRecorder,
}));

import { useGlobalToastQueue } from '.opencode/plugins/core/toast-queue';

describe('handleDebugLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock return value for each test
    mockGetDebugRecorder.mockReturnValue(null);
  });

  it('should handle null value', async () => {
    const timestamp = '2026-04-05T10:00:00.000Z';
    const title = 'DEBUG NULL';
    const data = null;

    await handleDebugLog(timestamp, title, data);

    const mockQueue = useGlobalToastQueue();
    expect(mockQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'DEBUG NULL',
        message: 'null',
      })
    );
  });

  it('should use debugRecorder.logDebug when debugRecorder exists', async () => {
    // Direct coverage test - set mock before calling
    const mockLogDebug = vi.fn().mockResolvedValue(undefined);
    mockGetDebugRecorder.mockReturnValue({
      logDebug: mockLogDebug,
    } as unknown as DebugRecorder);

    // Use non-sensitive key to avoid redaction
    await handleDebugLog('ts', 'title', { nonSensitive: 'value' });

    expect(mockLogDebug).toHaveBeenCalledWith({
      message: 'title',
      data: { nonSensitive: 'value' },
    });
  });
});

describe('sanitizeData', () => {
  it('should return primitives as-is', () => {
    expect(sanitizeData('string')).toBe('string');
    expect(sanitizeData(123)).toBe(123);
    expect(sanitizeData(true)).toBe(true);
  });

  it('should redact nested sensitive data', () => {
    const input = { user: { apiKey: 'xyz', password: 'secret' } };
    const result = sanitizeData(input) as { user: Record<string, unknown> };
    expect(result.user.apiKey).toBe('[REDACTED]');
    expect(result.user.password).toBe('[REDACTED]');
  });

  it('should handle array with objects containing sensitive data', () => {
    const input = { records: [{ secret: 'a' }, { secret: 'b' }] };
    const result = sanitizeData(input) as {
      records: Array<Record<string, unknown>>;
    };
    expect(result.records[0].secret).toBe('[REDACTED]');
    expect(result.records[1].secret).toBe('[REDACTED]');
  });

  it('should handle top-level array', () => {
    const input = [{ key: 'value1' }, { key: 'value2' }];
    const result = sanitizeData(input) as Array<Record<string, unknown>>;
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('value1');
    expect(result[1].key).toBe('value2');
  });
});
