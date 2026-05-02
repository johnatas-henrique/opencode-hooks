import { getBooleanField } from '.opencode/plugins/features/events/resolution/boolean-field';

describe('getBooleanField', () => {
  it('should return false when eventCfg and defaultCfg are undefined', () => {
    const result = getBooleanField({}, undefined, 'enabled', false);
    expect(result).toBe(false);
  });
});
