import {
  handleDebugLog,
  sanitizeData,
} from '../../.opencode/plugins/core/debug';

vi.mock('../../.opencode/plugins/core/toast-queue', () => {
  const mockAdd = vi.fn();
  const mockQueue = {
    add: mockAdd,
  };
  return {
    useGlobalToastQueue: vi.fn(() => mockQueue),
    __mockAdd: mockAdd,
  };
});

vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../.opencode/plugins/core/constants', () => ({
  TOAST_DURATION: { TEN_SECONDS: 10000 },
  DEBUG_LOG_FILE: 'debug.log',
}));

import { useGlobalToastQueue } from '../../.opencode/plugins/core/toast-queue';

describe('handleDebugLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
