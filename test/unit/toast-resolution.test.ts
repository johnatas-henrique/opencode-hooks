import {
  resolveToastOverride,
  resolveToastEnabled,
  resolveDefaultToast,
} from '../../.opencode/plugins/features/events/resolution/toast';
import type {
  EventConfig,
  EventOverride,
} from '../../.opencode/plugins/types/config';

describe('toast resolution', () => {
  describe('resolveToastOverride', () => {
    it('should return null when toast property is boolean', () => {
      const result = resolveToastOverride({ toast: false });
      expect(result).toBeNull();
    });
  });

  describe('resolveToastEnabled', () => {
    it('should return false from toast object when enabled is false', () => {
      const eventCfg: EventConfig = { toast: { enabled: false } };
      const result = resolveToastEnabled(eventCfg, undefined);
      expect(result).toBe(false);
    });

    it('should return enabled from toast object when explicitly set to true', () => {
      const eventCfg: EventConfig = { toast: { enabled: true } };
      const result = resolveToastEnabled(eventCfg, undefined);
      expect(result).toBe(true);
    });

    it('should return true from empty toast object', () => {
      const eventCfg: EventConfig = { toast: {} };
      const result = resolveToastEnabled(eventCfg, undefined);
      expect(result).toBe(true);
    });

    it('should use ?? fallback when enabled is explicitly undefined', () => {
      const eventCfg: EventConfig = { toast: { enabled: undefined } };
      const result = resolveToastEnabled(eventCfg, undefined);
      expect(result).toBe(true);
    });

    it('should return true from toast object with variant only', () => {
      const eventCfg: EventConfig = { toast: { variant: 'warning' } };
      const result = resolveToastEnabled(eventCfg, undefined);
      expect(result).toBe(true);
    });

    it('should return boolean when toast is boolean', () => {
      const result = resolveToastEnabled({ toast: true }, undefined);
      expect(result).toBe(true);
    });

    it('should return false when toast is boolean false', () => {
      const result = resolveToastEnabled({ toast: false }, undefined);
      expect(result).toBe(false);
    });
  });

  describe('resolveDefaultToast', () => {
    it('should return enabled from default toast when boolean false', () => {
      const defaultCfg: EventOverride = { toast: false };
      const result = resolveDefaultToast(defaultCfg);
      expect(result).toBe(false);
    });

    it('should return true when default toast is boolean true', () => {
      const defaultCfg: EventOverride = { toast: true };
      const result = resolveDefaultToast(defaultCfg);
      expect(result).toBe(true);
    });

    it('should return enabled from default toast object when enabled is true', () => {
      const defaultCfg: EventOverride = { toast: { enabled: true } };
      const result = resolveDefaultToast(defaultCfg);
      expect(result).toBe(true);
    });

    it('should return false from default toast object when enabled is false', () => {
      const defaultCfg: EventOverride = { toast: { enabled: false } };
      const result = resolveDefaultToast(defaultCfg);
      expect(result).toBe(false);
    });

    it('should return true when default toast enabled not set', () => {
      const defaultCfg: EventOverride = { toast: { variant: 'warning' } };
      const result = resolveDefaultToast(defaultCfg);
      expect(result).toBe(true);
    });

    it('should use ?? fallback when default toast enabled is explicitly undefined', () => {
      const defaultCfg: EventOverride = { toast: { enabled: undefined } };
      const result = resolveDefaultToast(defaultCfg);
      expect(result).toBe(true);
    });

    it('should return false when defaultCfg undefined', () => {
      const result = resolveDefaultToast(undefined);
      expect(result).toBe(false);
    });

    it('should return false when default toast undefined', () => {
      const defaultCfg: EventOverride = { enabled: true };
      const result = resolveDefaultToast(defaultCfg);
      expect(result).toBe(false);
    });
  });
});
