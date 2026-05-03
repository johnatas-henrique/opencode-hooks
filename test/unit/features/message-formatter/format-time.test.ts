import { describe, it, expect, vi } from 'vitest';
import { formatTime } from '.opencode/plugins/features/message-formatter/format-time';

describe('formatTime', () => {
  it('returns a locale time string', () => {
    const mockDate = new Date('2026-01-15T14:30:00');
    vi.setSystemTime(mockDate);
    const result = formatTime();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('uses toLocaleTimeString format', () => {
    const mockDate = new Date('2026-06-01T08:05:00');
    vi.setSystemTime(mockDate);
    const result = formatTime();
    expect(result).toBe(mockDate.toLocaleTimeString());
    vi.useRealTimers();
  });
});
