import { describe, it, expect } from 'vitest';
import {
  mergeClaudeScripts,
  resolveScripts,
} from '.opencode/plugins/features/events/resolution/scripts';
import type { ScriptEntry } from '.opencode/plugins/types/config';

describe('mergeClaudeScripts', () => {
  const baseScripts: ScriptEntry[] = [{ source: 'native', path: 'script.sh' }];

  it('appends claude scripts after base scripts', () => {
    const claudeScript: ScriptEntry = {
      source: 'claude',
      path: 'claude-hook.sh',
    };
    const result = mergeClaudeScripts(baseScripts, 'test.event', undefined, {
      'test.event': [claudeScript],
    });
    expect(result).toHaveLength(2);
    expect(result[0].source).toBe('native');
    expect(result[1].source).toBe('claude');
  });

  it('includes scripts without matcher when toolName provided', () => {
    const noMatcher: ScriptEntry = {
      source: 'claude',
      path: 'all-tools.sh',
    };
    const result = mergeClaudeScripts(baseScripts, 'test.event', 'Bash', {
      'test.event': [noMatcher],
    });
    expect(result).toHaveLength(2);
  });

  it('silently ignores invalid regex in matcher', () => {
    const badRegex: ScriptEntry = {
      source: 'claude',
      path: 'broken.sh',
      matcher: '[invalid',
    };
    const result = mergeClaudeScripts(baseScripts, 'test.event', 'Bash', {
      'test.event': [badRegex],
    });
    expect(result).toHaveLength(1);
  });
});

describe('resolveScripts', () => {
  it('returns empty when runScripts is false in object config', () => {
    const result = resolveScripts({ runScripts: false }, 'default.sh', []);
    expect(result.scripts).toEqual([]);
    expect(result.runScripts).toBe(false);
  });

  it('uses handler default script when runScripts is true', () => {
    const result = resolveScripts({ runScripts: true }, 'event-handler.sh', []);
    expect(result.scripts).toHaveLength(1);
    expect(result.scripts[0].path).toBe('event-handler.sh');
    expect(result.runScripts).toBe(true);
  });

  it('returns empty scripts for unexpected cfg type', () => {
    const result = resolveScripts(42 as never, 'default.sh', []);
    expect(result.scripts).toEqual([]);
    expect(result.runScripts).toBe(false);
  });
});
