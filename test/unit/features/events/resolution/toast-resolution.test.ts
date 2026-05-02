import {
  resolveToastEnabled,
  resolveDefaultToast,
} from '.opencode/plugins/features/events/resolution/toast';
import type {
  EventConfig,
  EventOverride,
} from '.opencode/plugins/types/config';

describe('toast resolution', () => {
  describe('resolveToastEnabled', () => {
    it('should return true from toast object with variant only', () => {
      const eventCfg: EventConfig = { toast: { variant: 'warning' } };
      const result = resolveToastEnabled(eventCfg, undefined);
      expect(result).toBe(true);
    });
  });

  describe('resolveDefaultToast', () => {
    it('should use ?? fallback when default toast enabled is explicitly undefined', () => {
      const defaultCfg: EventOverride = { toast: { enabled: undefined } };
      const result = resolveDefaultToast(defaultCfg);
      expect(result).toBe(true);
    });
  });
});
