import { describe, it, expect } from 'vitest';
import { truncate } from '.opencode/plugins/features/message-formatter/formatters';

describe('truncate', () => {
  it('returns the string unchanged if within maxLength (default 1000)', () => {
    const str = 'a'.repeat(500);
    const result = truncate(str);
    expect(result).toBe(str);
    expect(result.length).toBe(500);
  });

  it('truncates and appends "..." when string exceeds maxLength', () => {
    const str = 'a'.repeat(1500);
    const result = truncate(str, 1000);
    expect(result).toBe('a'.repeat(1000) + '...');
    expect(result.length).toBe(1003);
  });

  it('uses default maxToastLength (1000) when no maxLength provided', () => {
    const str = 'a'.repeat(2000);
    const result = truncate(str);
    expect(result.length).toBe(1003);
    expect(result.endsWith('...')).toBe(true);
  });

  it('uses custom maxLength when provided', () => {
    const str = 'hello world';
    const result = truncate(str, 5);
    expect(result).toBe('hello...');
  });

  it('does not truncate when length equals maxLength', () => {
    const str = 'hello';
    const result = truncate(str, 5);
    expect(result).toBe('hello');
  });

  it('handles empty string', () => {
    expect(truncate('')).toBe('');
  });

  it('handles very short maxLength', () => {
    const str = 'hello';
    const result = truncate(str, 1);
    expect(result).toBe('h...');
  });
});
