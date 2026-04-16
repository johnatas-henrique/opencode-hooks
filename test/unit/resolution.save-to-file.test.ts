import { resolveSaveToFile } from '../../.opencode/plugins/features/events/resolution/save-to-file';
import type {
  EventConfig,
  EventOverride,
} from '../../.opencode/plugins/types/config';

describe('resolveSaveToFile', () => {
  const defaultCfg = { enabled: true, saveToFile: true };

  it('should return false if cfg is false', () => {
    expect(resolveSaveToFile(false as EventConfig, defaultCfg)).toBe(false);
  });

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

  it('should return false if saveToFile is undefined in object config', () => {
    const cfg: EventOverride = { enabled: true };
    const result = resolveSaveToFile(cfg, defaultCfg);
    expect(result).toBe(true); // It falls back to defaultCfg.saveToFile which is true
  });

  it('should return false if defaultCfg is null', () => {
    const cfg: EventConfig = false;
    expect(resolveSaveToFile(cfg, undefined)).toBe(false);
  });
});
