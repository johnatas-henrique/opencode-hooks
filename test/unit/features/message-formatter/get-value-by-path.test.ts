import { describe, it, expect } from 'vitest';
import { getValueByPath } from '.opencode/plugins/features/message-formatter/get-value-by-path';

describe('getValueByPath', () => {
  it('returns value for a single key', () => {
    const obj = { foo: 'bar' };
    expect(getValueByPath(obj, 'foo')).toBe('bar');
  });

  it('returns nested value for dot-separated path', () => {
    const obj = { a: { b: { c: 42 } } };
    expect(getValueByPath(obj, 'a.b.c')).toBe(42);
  });

  it('returns undefined for non-existent path', () => {
    const obj = { foo: 'bar' };
    expect(getValueByPath(obj, 'baz')).toBeUndefined();
  });

  it('returns undefined for deeply nested non-existent path', () => {
    const obj = { a: { b: 'c' } };
    expect(getValueByPath(obj, 'a.x.y')).toBeUndefined();
  });

  it('handles null root gracefully', () => {
    expect(getValueByPath(null, 'foo')).toBeUndefined();
  });

  it('handles undefined root gracefully', () => {
    expect(getValueByPath(undefined, 'foo')).toBeUndefined();
  });

  it('handles empty path', () => {
    const obj = { foo: 'bar' };
    expect(getValueByPath(obj, '')).toBeUndefined();
  });

  it('accesses array items via index', () => {
    const obj = { items: [10, 20, 30] };
    expect(getValueByPath(obj, 'items')).toEqual([10, 20, 30]);
  });
});
