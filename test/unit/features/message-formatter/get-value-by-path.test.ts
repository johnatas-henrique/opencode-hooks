import { describe, it, expect } from 'vitest';
import {
  getValueByPath,
  setValueByPath,
} from '.opencode/plugins/features/message-formatter/get-value-by-path';

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

describe('setValueByPath', () => {
  it('sets value at a single key', () => {
    const obj: Record<string, unknown> = {};
    setValueByPath(obj, 'foo', 'bar');
    expect(obj.foo).toBe('bar');
  });

  it('sets nested value creating intermediate objects', () => {
    const obj: Record<string, unknown> = {};
    setValueByPath(obj, 'a.b.c', 42);
    expect(obj).toEqual({ a: { b: { c: 42 } } });
  });

  it('overwrites existing value at path', () => {
    const obj: Record<string, unknown> = { a: { b: 1 } };
    setValueByPath(obj, 'a.b', 99);
    expect(obj.a).toEqual({ b: 99 });
  });

  it('does nothing when path is empty', () => {
    const obj: Record<string, unknown> = {};
    setValueByPath(obj, '', 'value');
    expect(obj).toEqual({});
  });

  it('creates intermediate objects when traversing through non-objects', () => {
    const obj: Record<string, unknown> = { a: 'string' };
    setValueByPath(obj, 'a.b.c', 42);
    expect(obj).toEqual({ a: { b: { c: 42 } } });
  });

  it('handles deeply nested paths', () => {
    const obj: Record<string, unknown> = {};
    setValueByPath(obj, 'level1.level2.level3.level4', 'deep');
    expect(getValueByPath(obj, 'level1.level2.level3.level4')).toBe('deep');
  });
});
