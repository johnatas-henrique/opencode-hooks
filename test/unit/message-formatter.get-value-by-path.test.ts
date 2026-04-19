import { setValueByPath } from '../../.opencode/plugins/features/message-formatter/get-value-by-path';

describe('getValueByPath', () => {
  it('should create intermediate objects', () => {
    const obj: Record<string, unknown> = {};
    setValueByPath(obj, 'a.b.c', 42);
    expect(obj).toEqual({ a: { b: { c: 42 } } });
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
});
