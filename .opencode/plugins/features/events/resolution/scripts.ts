import type { ResolvedScripts } from '.opencode/plugins/types/events';
import type { EventConfig, ScriptEntry } from '.opencode/plugins/types/config';

export function asScriptEntry(path: string): ScriptEntry {
  return { source: 'native', path };
}

export function resolveScripts(
  cfg: EventConfig | undefined,
  handlerDefaultScript: string,
  eventBaseScripts: ScriptEntry[]
): ResolvedScripts {
  if (cfg === undefined || cfg === false) {
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
      return {
        scripts: [asScriptEntry(handlerDefaultScript)],
        runScripts: true,
      };
    }
    return { scripts: eventBaseScripts, runScripts: false };
  }

  if (cfg === true) {
    return { scripts: [asScriptEntry(handlerDefaultScript)], runScripts: true };
  }

  return { scripts: [], runScripts: false };
}

export function mergeClaudeScripts(
  baseScripts: ScriptEntry[],
  eventType: string,
  toolName: string | undefined,
  claudeScripts: Record<string, ScriptEntry[]>
): ScriptEntry[] {
  const eventClaudeScripts = claudeScripts[eventType];
  if (!eventClaudeScripts || eventClaudeScripts.length === 0) {
    return baseScripts;
  }

  const filtered = toolName
    ? eventClaudeScripts.filter((s) => {
        if (!s.matcher) return true;
        try {
          return new RegExp(s.matcher).test(toolName);
        } catch {
          return false;
        }
      })
    : eventClaudeScripts;

  if (filtered.length === 0) return baseScripts;
  return [...baseScripts, ...filtered];
}
