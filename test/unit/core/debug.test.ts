import { sanitizeData } from '.opencode/plugins/core/debug';

describe('debug', () => {
  describe('sanitizeData', () => {
    it('returns null unchanged', () => {
      expect(sanitizeData(null)).toBeNull();
    });

    it('returns undefined unchanged', () => {
      expect(sanitizeData(undefined)).toBeUndefined();
    });

    it('returns primitives unchanged', () => {
      expect(sanitizeData(42)).toBe(42);
      expect(sanitizeData('hello')).toBe('hello');
      expect(sanitizeData(true)).toBe(true);
    });

    it('redacts password field', () => {
      const result = sanitizeData({ password: 'secret123', user: 'john' });
      expect(result).toEqual({ password: '[REDACTED]', user: 'john' });
    });

    it('redacts token field case-insensitively', () => {
      const result = sanitizeData({ Token: 'abc', name: 'test' });
      expect(result).toEqual({ Token: '[REDACTED]', name: 'test' });
    });

    it('redacts nested sensitive fields', () => {
      const result = sanitizeData({
        config: { apiKey: 'key123', timeout: 5000 },
      });
      expect(result).toEqual({
        config: { apiKey: '[REDACTED]', timeout: 5000 },
      });
    });

    it('redacts sensitive fields in arrays', () => {
      const result = sanitizeData([
        { token: 'tok1', id: 1 },
        { token: 'tok2', id: 2 },
      ]);
      expect(result).toEqual([
        { token: '[REDACTED]', id: 1 },
        { token: '[REDACTED]', id: 2 },
      ]);
    });

    it('handles arrays of primitives', () => {
      const result = sanitizeData([1, 2, 'three']);
      expect(result).toEqual([1, 2, 'three']);
    });

    it('redacts all sensitive key variations', () => {
      const result = sanitizeData({
        secret: 'a',
        api_key: 'b',
        auth: 'c',
        credentials: 'd',
        authorization: 'e',
        privateKey: 'f',
        private_key: 'g',
        accessToken: 'h',
        access_token: 'i',
      });
      expect(result).toEqual({
        secret: '[REDACTED]',
        api_key: '[REDACTED]',
        auth: '[REDACTED]',
        credentials: '[REDACTED]',
        authorization: '[REDACTED]',
        privateKey: '[REDACTED]',
        private_key: '[REDACTED]',
        accessToken: '[REDACTED]',
        access_token: '[REDACTED]',
      });
    });

    it('handles empty object', () => {
      expect(sanitizeData({})).toEqual({});
    });

    it('handles deeply nested objects', () => {
      const result = sanitizeData({
        a: { b: { password: 'deep', c: 'keep' } },
      });
      expect(result).toEqual({
        a: { b: { password: '[REDACTED]', c: 'keep' } },
      });
    });

    it('handles mixed arrays in objects', () => {
      const result = sanitizeData({
        items: [{ token: 'x' }, 42, 'str', { name: 'ok' }],
      });
      expect(result).toEqual({
        items: [{ token: '[REDACTED]' }, 42, 'str', { name: 'ok' }],
      });
    });
  });
});
