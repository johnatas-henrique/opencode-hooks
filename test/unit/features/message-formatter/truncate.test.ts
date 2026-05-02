import { truncate } from '.opencode/plugins/features/message-formatter/truncate';

describe('truncate', () => {
  it('handles unicode characters', () => {
    const result = truncate('🎉🎉🎉🎉🎉', 4);
    expect(result).toBe('🎉🎉...');
  });
});
