import {
  getValueByPath,
  setValueByPath,
} from '../../.opencode/plugins/features/message-formatter/get-value-by-path';

describe('getValueByPath', () => {
  it('should get top-level property', () => {
    const obj = { name: 'John', age: 30 };
    expect(getValueByPath(obj, 'name')).toBe('John');
    expect(getValueByPath(obj, 'age')).toBe(30);
  });

  it('should get nested property', () => {
    const obj = { user: { profile: { name: 'John' } } };
    expect(getValueByPath(obj, 'user.profile.name')).toBe('John');
  });

  it('should return undefined for missing property', () => {
    const obj = { user: { profile: { name: 'John' } } };
    expect(getValueByPath(obj, 'user.profile.email')).toBeUndefined();
  });

  it('should return undefined for missing path', () => {
    const obj = { user: { profile: { name: 'John' } } };
    expect(getValueByPath(obj, 'nonexistent.path')).toBeUndefined();
  });

  it('should return undefined for empty object', () => {
    expect(getValueByPath({}, 'name')).toBeUndefined();
  });

  it('should handle null value in path', () => {
    const obj = { user: null };
    expect(getValueByPath(obj, 'user.profile')).toBeUndefined();
  });

  it('should handle array index in path', () => {
    const obj = { users: [{ name: 'John' }, { name: 'Jane' }] };
    expect(getValueByPath(obj, 'users.0.name')).toBe('John');
    expect(getValueByPath(obj, 'users.1.name')).toBe('Jane');
  });
});

describe('setValueByPath', () => {
  it('should set top-level property', () => {
    const obj: Record<string, unknown> = {};
    setValueByPath(obj, 'name', 'John');
    expect(obj.name).toBe('John');
  });

  it('should set nested property', () => {
    const obj: Record<string, unknown> = {};
    setValueByPath(obj, 'user.profile.name', 'John');
    expect((obj.user as Record<string, unknown>).profile).toEqual({
      name: 'John',
    });
  });

  it('should create intermediate objects', () => {
    const obj: Record<string, unknown> = {};
    setValueByPath(obj, 'a.b.c', 42);
    expect(obj).toEqual({ a: { b: { c: 42 } } });
  });

  it('should overwrite existing value', () => {
    const obj: Record<string, unknown> = { name: 'John' };
    setValueByPath(obj, 'name', 'Jane');
    expect(obj.name).toBe('Jane');
  });

  it('should handle nested overwrite', () => {
    const obj: Record<string, unknown> = { user: { name: 'John' } };
    setValueByPath(obj, 'user.name', 'Jane');
    expect((obj.user as Record<string, unknown>).name).toBe('Jane');
  });

  it('should handle empty path parts', () => {
    const obj: Record<string, unknown> = {};
    setValueByPath(obj, '', 'value');
    expect(obj).toEqual({});
  });

  it('should throw when intermediate value is null', () => {
    const obj: Record<string, unknown> = { user: null };
    expect(() => setValueByPath(obj, 'user.profile', 'value')).toThrow();
  });

  it('should handle single part path', () => {
    const obj: Record<string, unknown> = {};
    setValueByPath(obj, 'name', 'John');
    expect(obj.name).toBe('John');
  });
});
