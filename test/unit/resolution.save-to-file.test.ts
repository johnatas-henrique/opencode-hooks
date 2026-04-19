import { resolveSaveToFile } from '../../.opencode/plugins/features/events/resolution/save-to-file';
import type { EventOverride } from '../../.opencode/plugins/types/config';

describe('resolveSaveToFile', () => {
  const defaultCfg = { enabled: true, saveToFile: true };

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
});
