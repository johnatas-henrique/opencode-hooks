import { describe, it, expect } from 'vitest';
import {
  mergeClaudeScripts,
  resolveScripts,
  asScriptEntry,
} from '.opencode/plugins/features/events/resolution/scripts';
import type { ScriptEntry } from '.opencode/plugins/types/config';

describe('mergeClaudeScripts', () => {
  const baseScripts: ScriptEntry[] = [{ source: 'native', path: 'script.sh' }];

  it('returns base scripts when no claude scripts for event', () => {
    const result = mergeClaudeScripts(baseScripts, 'test.event', undefined, {});
    expect(result).toBe(baseScripts);
  });

  it('returns base scripts when claude scripts array is empty', () => {
    const result = mergeClaudeScripts(baseScripts, 'test.event', undefined, {
      'test.event': [],
    });
    expect(result).toBe(baseScripts);
  });

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

  it('filters by matcher when toolName is provided', () => {
    const matching: ScriptEntry = {
      source: 'claude',
      path: 'for-bash.sh',
      matcher: 'Bash',
    };
    const nonMatching: ScriptEntry = {
      source: 'claude',
      path: 'for-write.sh',
      matcher: 'Write',
    };
    const result = mergeClaudeScripts(baseScripts, 'test.event', 'Bash', {
      'test.event': [matching, nonMatching],
    });
    expect(result).toHaveLength(2);
    expect(result[1].path).toBe('for-bash.sh');
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

  it('returns base scripts when all claude scripts filtered out', () => {
    const filtered: ScriptEntry = {
      source: 'claude',
      path: 'for-write.sh',
      matcher: 'Write',
    };
    const result = mergeClaudeScripts(baseScripts, 'test.event', 'Bash', {
      'test.event': [filtered],
    });
    expect(result).toBe(baseScripts);
  });
});

describe('resolveScripts', () => {
  it('returns empty when cfg is false', () => {
    const result = resolveScripts(false, 'default.sh', []);
    expect(result.scripts).toEqual([]);
    expect(result.runScripts).toBe(false);
  });

  it('returns empty when runScripts is false in object config', () => {
    const result = resolveScripts({ runScripts: false }, 'default.sh', []);
    expect(result.scripts).toEqual([]);
    expect(result.runScripts).toBe(false);
  });

  it('returns configured scripts when provided', () => {
    const scripts: ScriptEntry[] = [{ source: 'native', path: 'custom.sh' }];
    const result = resolveScripts({ scripts }, 'default.sh', []);
    expect(result.scripts).toEqual(scripts);
    expect(result.runScripts).toBe(true);
  });

  it('uses handler default script when runScripts is true', () => {
    const result = resolveScripts({ runScripts: true }, 'event-handler.sh', []);
    expect(result.scripts).toHaveLength(1);
    expect(result.scripts[0].path).toBe('event-handler.sh');
    expect(result.runScripts).toBe(true);
  });

  it('returns event base scripts when cfg is undefined', () => {
    const baseScripts: ScriptEntry[] = [{ source: 'native', path: 'base.sh' }];
    const result = resolveScripts(undefined, 'default.sh', baseScripts);
    expect(result.scripts).toEqual([]);
    expect(result.runScripts).toBe(false);
  });

  it('returns handler default script when cfg is true', () => {
    const result = resolveScripts(true, 'default.sh', []);
    expect(result.scripts).toHaveLength(1);
    expect(result.scripts[0].path).toBe('default.sh');
    expect(result.runScripts).toBe(true);
  });

  it('returns empty scripts for unexpected cfg type', () => {
    const result = resolveScripts(42 as never, 'default.sh', []);
    expect(result.scripts).toEqual([]);
    expect(result.runScripts).toBe(false);
  });
});

describe('asScriptEntry', () => {
  it('creates script entry with native source', () => {
    const result = asScriptEntry('my-script.sh');
    expect(result.source).toBe('native');
    expect(result.path).toBe('my-script.sh');
  });
});
