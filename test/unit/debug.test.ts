import {
  handleDebugLog,
  sanitizeData,
} from '../../.opencode/plugins/helpers/debug';

jest.mock('../../.opencode/plugins/helpers/toast-queue', () => {
  const mockQueue = {
    add: jest.fn(),
  };
  return {
    useGlobalToastQueue: jest.fn(() => mockQueue),
  };
});

jest.mock('../../.opencode/plugins/helpers/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../.opencode/plugins/helpers/constants', () => ({
  TOAST_DURATION: { TEN_SECONDS: 10000 },
  DEBUG_LOG_FILE: 'debug.log',
}));

const mockUseGlobalToastQueue =
  require('../../.opencode/plugins/helpers/toast-queue').useGlobalToastQueue;
const mockSaveToFile =
  require('../../.opencode/plugins/helpers/save-to-file').saveToFile;

describe('handleDebugLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add debug toast and save to file', async () => {
    const timestamp = '2026-04-05T10:00:00.000Z';
    const title = 'DEBUG TEST';
    const data = { key: 'value' };

    await handleDebugLog(timestamp, title, data);

    expect(mockUseGlobalToastQueue().add).toHaveBeenCalledWith({
      title: 'DEBUG TEST',
      message: JSON.stringify(data, null, 2),
      variant: 'info',
      duration: 10000,
    });

    expect(mockSaveToFile).toHaveBeenCalledWith({
      content: expect.stringContaining('"type":"DEBUG"'),
      filename: 'debug.log',
      showToast: mockUseGlobalToastQueue().add,
    });
  });

  it('should stringify complex data correctly', async () => {
    const timestamp = '2026-04-05T10:00:00.000Z';
    const title = 'DEBUG EVENT';
    const data = { nested: { deep: 'value' }, array: [1, 2, 3] };

    await handleDebugLog(timestamp, title, data);

    expect(mockUseGlobalToastQueue().add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'DEBUG EVENT',
        variant: 'info',
        duration: 10000,
      })
    );
  });

  it('should handle empty object', async () => {
    const timestamp = '2026-04-05T10:00:00.000Z';
    const title = 'DEBUG EMPTY';
    const data = {};

    await handleDebugLog(timestamp, title, data);

    expect(mockUseGlobalToastQueue().add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'DEBUG EMPTY',
        message: '{}',
      })
    );
  });

  it('should handle null value', async () => {
    const timestamp = '2026-04-05T10:00:00.000Z';
    const title = 'DEBUG NULL';
    const data = null;

    await handleDebugLog(timestamp, title, data);

    expect(mockUseGlobalToastQueue().add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'DEBUG NULL',
        message: 'null',
      })
    );
  });
});

describe('sanitizeData', () => {
  it('should return null as-is', () => {
    expect(sanitizeData(null)).toBeNull();
  });

  it('should return undefined as-is', () => {
    expect(sanitizeData(undefined)).toBeUndefined();
  });

  it('should return primitives as-is', () => {
    expect(sanitizeData('string')).toBe('string');
    expect(sanitizeData(123)).toBe(123);
    expect(sanitizeData(true)).toBe(true);
  });

  it('should redact password field', () => {
    const input = { username: 'john', password: 'secret123' };
    const result = sanitizeData(input) as Record<string, unknown>;
    expect(result.username).toBe('john');
    expect(result.password).toBe('[REDACTED]');
  });

  it('should redact token field (case insensitive)', () => {
    const input = { TOKEN: 'abc123', AccessToken: 'xyz' };
    const result = sanitizeData(input) as Record<string, unknown>;
    expect(result.TOKEN).toBe('[REDACTED]');
    expect(result.AccessToken).toBe('[REDACTED]');
  });

  it('should redact api_key field', () => {
    const input = { api_key: 'sk-12345' };
    const result = sanitizeData(input) as Record<string, unknown>;
    expect(result.api_key).toBe('[REDACTED]');
  });

  it('should redact private_key field', () => {
    const input = { private_key: 'key123' };
    const result = sanitizeData(input) as Record<string, unknown>;
    expect(result.private_key).toBe('[REDACTED]');
  });

  it('should redact access_token field', () => {
    const input = { access_token: 'token123' };
    const result = sanitizeData(input) as Record<string, unknown>;
    expect(result.access_token).toBe('[REDACTED]');
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

  it('should not redact non-sensitive keys', () => {
    const input = { name: 'John', email: 'john@example.com', age: 30 };
    const result = sanitizeData(input) as Record<string, unknown>;
    expect(result.name).toBe('John');
    expect(result.email).toBe('john@example.com');
    expect(result.age).toBe(30);
  });

  it('should handle empty object', () => {
    const result = sanitizeData({});
    expect(result).toEqual({});
  });

  it('should handle object with only non-sensitive keys', () => {
    const input = { id: '123', name: 'Test', status: 'active' };
    const result = sanitizeData(input) as Record<string, unknown>;
    expect(result).toEqual(input);
  });

  it('should handle top-level array', () => {
    const input = [{ key: 'value1' }, { key: 'value2' }];
    const result = sanitizeData(input) as Array<Record<string, unknown>>;
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('value1');
    expect(result[1].key).toBe('value2');
  });
});
