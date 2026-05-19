import { describe, it, expect } from 'vitest';
import { formatValue } from '.opencode/plugins/features/message-formatter/formatters';

describe('formatValue', () => {
  it('returns "unknown" for null', () => {
    expect(formatValue(null)).toBe('unknown');
  });

  it('returns "unknown" for undefined', () => {
    expect(formatValue(undefined)).toBe('unknown');
  });

  it('serializes string values', () => {
    const result = formatValue('hello');
    expect(result).toContain('hello');
  });

  it('serializes number values', () => {
    const result = formatValue(42);
    expect(result).toContain('42');
  });

  it('serializes object values with JSON.stringify', () => {
    const result = formatValue({ foo: 'bar' });
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });

  it('serializes array values', () => {
    const result = formatValue([1, 2, 3]);
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('3');
  });

  it('serializes object with sensitive keys', () => {
    const result = formatValue({ api_key: 'sk-12345' });
    expect(result).toContain('api_key');
    expect(result).toContain('sk-12345');
  });

  it('truncates long strings beyond maxToastLength', () => {
    const longStr = 'a'.repeat(2000);
    const result = formatValue(longStr);
    expect(result.length).toBeLessThan(2000);
    expect(result).toContain('...');
  });
});
