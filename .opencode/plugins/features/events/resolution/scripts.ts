import type { ResolvedScripts } from '../../../types/events';
import type { EventConfig } from '../../../types/config';

export function resolveScripts(
  cfg: EventConfig,
  handlerDefaultScript: string,
  eventBaseScripts: string[]
): ResolvedScripts {
  if (cfg === false) {
    return { scripts: [], runScripts: false };
  }

  if (typeof cfg === 'object' && cfg !== null) {
    if (cfg.runScripts === false) {
      return { scripts: [], runScripts: false };
    }
    if (cfg.scripts !== undefined) {
      return { scripts: cfg.scripts, runScripts: true };
    }
    if (cfg.runScripts === true) {
      return { scripts: [handlerDefaultScript], runScripts: true };
    }
    return { scripts: eventBaseScripts, runScripts: false };
  }

  if (cfg === true) {
    return { scripts: [handlerDefaultScript], runScripts: true };
  }

  return { scripts: [], runScripts: false };
}
