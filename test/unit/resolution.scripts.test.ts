import { resolveScripts } from '../../.opencode/plugins/features/events/resolution/scripts';

describe('resolveScripts', () => {
  const handlerDefault = 'default.sh';
  const baseScripts = ['base1.sh', 'base2.sh'];

  it('should return empty scripts if cfg is undefined', () => {
    expect(resolveScripts(undefined, handlerDefault, baseScripts)).toEqual({
      scripts: [],
      runScripts: false,
    });
  });
});
