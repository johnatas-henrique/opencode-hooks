import { formatTime } from '.opencode/plugins/features/message-formatter/format-time';

describe('formatTime', () => {
  it('returns non-empty string', () => {
    const result = formatTime();
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns valid time format', () => {
    const result = formatTime();
    expect(result).toMatch(/^\d{1,2}:\d{2}:\d{2}/);
  });
});
