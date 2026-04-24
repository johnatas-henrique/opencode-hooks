import { getBooleanField } from '../../.opencode/plugins/features/events/resolution/boolean-field';
import type {
  EventConfig,
  EventOverride,
} from '../../.opencode/plugins/types/config';

describe('getBooleanField', () => {
  it('should return eventCfg value when defined', () => {
    const eventCfg: EventConfig = { enabled: true };
    const result = getBooleanField(eventCfg, undefined, 'enabled', false);
    expect(result).toBe(true);
  });

  it('should return false when eventCfg enabled is false', () => {
    const eventCfg: EventConfig = { enabled: false };
    const result = getBooleanField(eventCfg, undefined, 'enabled', true);
    expect(result).toBe(false);
  });

  it('should return defaultCfg value when eventCfg undefined (line 20)', () => {
    const eventCfg: EventConfig = {};
    const defaultCfg: EventOverride = { enabled: true };
    const result = getBooleanField(eventCfg, defaultCfg, 'enabled', false);
    expect(result).toBe(true);
  });

  it('should cover line 20 when defaultCfg is defined but key is undefined', () => {
    const eventCfg: EventConfig = { enabled: undefined };
    const defaultCfg: EventOverride = { enabled: undefined };
    const result = getBooleanField(eventCfg, defaultCfg, 'enabled', false);
    expect(result).toBe(false);
  });

  it('should cover defaultCfg !== null branch (line 20)', () => {
    const eventCfg: EventConfig = { enabled: undefined };
    const defaultCfg: EventOverride = { enabled: true };
    const result = getBooleanField(eventCfg, defaultCfg, 'enabled', false);
    expect(result).toBe(true);
  });

  it('should return false when eventCfg and defaultCfg are undefined', () => {
    const result = getBooleanField({}, undefined, 'enabled', false);
    expect(result).toBe(false);
  });

  it('should handle toast key specially', () => {
    const eventCfg: EventConfig = { toast: false };
    const result = getBooleanField(eventCfg, undefined, 'toast', true);
    expect(result).toBe(false);
  });
});
