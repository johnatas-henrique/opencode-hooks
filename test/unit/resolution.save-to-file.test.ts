import { resolveSaveToFile } from '../../.opencode/plugins/features/events/resolution/save-to-file';
import type {
  EventOverride,
  EventConfig,
} from '../../.opencode/plugins/types/config';

describe('resolveSaveToFile', () => {
  const defaultCfg: EventConfig = { enabled: true, saveToFile: true };

  it('should return parseFileTemplate result if saveToFile is defined in object config', () => {
    const cfg: EventOverride = {
      saveToFile: {
        enabled: true,
        template: 'Test Template',
        path: '/test/path.log',
      },
    };
    const result = resolveSaveToFile(cfg, defaultCfg);
    expect(result).toEqual({
      enabled: true,
      template: 'Test Template',
      path: '/test/path.log',
    });
  });

  it('should return false when eventCfg is false', () => {
    const result = resolveSaveToFile(false, defaultCfg);
    expect(result).toBe(false);
  });

  it('should return true when saveToFile is undefined in object config but defaultCfg has true', () => {
    const cfg: EventOverride = { enabled: true };
    const result = resolveSaveToFile(cfg, defaultCfg);
    expect(result).toBe(true);
  });

  it('should return false when invalid object type is passed', () => {
    const cfg: EventOverride = {
      saveToFile: 'invalid-type' as never,
    };
    const result = resolveSaveToFile(cfg, defaultCfg);
    expect(result).toBe(false);
  });

  it('should return false when defaultCfg saveToFile is string (invalid type)', () => {
    const defaultWithFile: EventConfig = {
      enabled: true,
      saveToFile: '/default.log' as never,
    };
    const result = resolveSaveToFile(undefined, defaultWithFile);
    expect(result).toBe(false);
  });

  it('should return defaultCfg saveToFile when eventCfg is undefined and valid type', () => {
    const defaultWithFile: EventConfig = {
      enabled: true,
      saveToFile: {
        enabled: true,
        path: '/default.log',
      },
    };
    const result = resolveSaveToFile(undefined, defaultWithFile);
    expect(result).toEqual({
      enabled: true,
      path: '/default.log',
      template: undefined,
    });
  });

  it('should return false when defaultCfg saveToFile is undefined', () => {
    const defaultWithoutFile: EventConfig = { enabled: true };
    const result = resolveSaveToFile(undefined, defaultWithoutFile);
    expect(result).toBe(false);
  });
});
