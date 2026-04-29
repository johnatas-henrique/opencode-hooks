import { resolveScripts } from '../../.opencode/plugins/features/events/resolution/scripts';
import type { EventConfig } from '../../.opencode/plugins/types/config';

describe('resolveScripts', () => {
  const handlerDefault = 'default.sh';
  const baseScripts = ['base1.sh', 'base2.sh'];

  it('should return empty scripts when cfg.runScripts === false', () => {
    expect(
      resolveScripts({ runScripts: false }, handlerDefault, baseScripts)
    ).toEqual({
      scripts: [],
      runScripts: false,
    });
  });

  it('should return empty scripts if cfg is undefined', () => {
    expect(
      resolveScripts(
        undefined as unknown as EventConfig,
        handlerDefault,
        baseScripts
      )
    ).toEqual({
      scripts: [],
      runScripts: false,
    });
  });
});
