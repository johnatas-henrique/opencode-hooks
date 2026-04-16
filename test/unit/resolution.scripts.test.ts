import { resolveScripts } from '../../.opencode/plugins/features/events/resolution/scripts';
import type { EventConfig } from '../../.opencode/plugins/types/config';

describe('resolveScripts', () => {
  const handlerDefault = 'default.sh';
  const baseScripts = ['base1.sh', 'base2.sh'];

  it('should return empty scripts if cfg is false', () => {
    expect(resolveScripts(false, handlerDefault, baseScripts)).toEqual({
      scripts: [],
      runScripts: false,
    });
  });

  it('should return scripts from config if scripts is defined', () => {
    const cfg: EventConfig = { scripts: ['custom.sh'], runScripts: true };
    expect(resolveScripts(cfg, handlerDefault, baseScripts)).toEqual({
      scripts: ['custom.sh'],
      runScripts: true,
    });
  });

  it('should return default script if runScripts is true and scripts is undefined', () => {
    const cfg: EventConfig = { runScripts: true };
    expect(resolveScripts(cfg, handlerDefault, baseScripts)).toEqual({
      scripts: [handlerDefault],
      runScripts: true,
    });
  });

  it('should return base scripts if cfg is object and runScripts is not explicitly true/false', () => {
    const cfg: EventConfig = { enabled: true };
    expect(resolveScripts(cfg, handlerDefault, baseScripts)).toEqual({
      scripts: baseScripts,
      runScripts: false,
    });
  });

  it('should return default script if cfg is true', () => {
    expect(resolveScripts(true, handlerDefault, baseScripts)).toEqual({
      scripts: [handlerDefault],
      runScripts: true,
    });
  });

  it('should return empty scripts for any other cfg', () => {
    expect(resolveScripts(undefined, handlerDefault, baseScripts)).toEqual({
      scripts: [],
      runScripts: false,
    });
  });
});
