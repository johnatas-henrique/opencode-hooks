import { truncate } from '.opencode/plugins/features/message-formatter/truncate';

describe('truncate', () => {
  it.skip('returns string unchanged when equal to max length', () => {
    const result = truncate('hello', 5);
    expect(result).toBe('hello');
  });

  it.skip('truncates string when over max length', () => {
    const result = truncate('hello world', 5);
    expect(result).toBe('hello...');
  });

  it.skip('uses MAX_TOAST_LENGTH as default', () => {
    const longString = 'a'.repeat(1001);
    const result = truncate(longString);
    expect(result).toHaveLength(1003); // 1000 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it.skip('truncates to exact maxLength plus ellipsis', () => {
    const result = truncate('abcdefghij', 5);
    expect(result).toBe('abcde...');
    expect(result).toHaveLength(8); // 5 + 3
  });

  it.skip('handles empty string', () => {
    const result = truncate('', 5);
    expect(result).toBe('');
  });

  it.skip('handles zero maxLength', () => {
    const result = truncate('hello', 0);
    expect(result).toBe('...');
  });

  it('handles unicode characters', () => {
    const result = truncate('🎉🎉🎉🎉🎉', 4);
    expect(result).toBe('🎉🎉...');
  });
});
