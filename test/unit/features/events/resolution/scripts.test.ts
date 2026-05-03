import { describe, it, expect } from 'vitest';
import {
  asScriptEntry,
  resolveScripts,
  mergeClaudeScripts,
} from '.opencode/plugins/features/events/resolution/scripts';
import type { ScriptEntry, EventConfig } from '.opencode/plugins/types/config';

describe('asScriptEntry', () => {
  it('returns a ScriptEntry with source native and given path', () => {
    const result = asScriptEntry('test.sh');
    expect(result).toEqual({ source: 'native', path: 'test.sh' });
  });
});

describe('resolveScripts', () => {
  const handlerDefault = 'default.sh';
  const baseScripts: ScriptEntry[] = [{ source: 'native', path: 'base.sh' }];

  it('returns empty scripts when cfg is undefined', () => {
    const result = resolveScripts(undefined, handlerDefault, baseScripts);
    expect(result).toEqual({ scripts: [], runScripts: false });
  });

  it('returns empty scripts when cfg is false', () => {
    const result = resolveScripts(false, handlerDefault, baseScripts);
    expect(result).toEqual({ scripts: [], runScripts: false });
  });

  it('returns empty scripts when cfg.runScripts is false', () => {
    const result = resolveScripts(
      { enabled: true, runScripts: false },
      handlerDefault,
      baseScripts
    );
    expect(result).toEqual({ scripts: [], runScripts: false });
  });

  it('returns cfg.scripts when cfg.scripts is defined', () => {
    const cfgScripts: ScriptEntry[] = [{ source: 'native', path: 'custom.sh' }];
    const result = resolveScripts(
      { enabled: true, scripts: cfgScripts },
      handlerDefault,
      baseScripts
    );
    expect(result).toEqual({ scripts: cfgScripts, runScripts: true });
  });

  it('returns handler default script when cfg.runScripts is true', () => {
    const result = resolveScripts(
      { enabled: true, runScripts: true },
      handlerDefault,
      baseScripts
    );
    expect(result).toEqual({
      scripts: [{ source: 'native', path: handlerDefault }],
      runScripts: true,
    });
  });

  it('returns base scripts when cfg is object but no scripts/runScripts', () => {
    const result = resolveScripts(
      { enabled: true },
      handlerDefault,
      baseScripts
    );
    expect(result).toEqual({ scripts: baseScripts, runScripts: false });
  });

  it('returns handler default script when cfg is true', () => {
    const result = resolveScripts(true, handlerDefault, baseScripts);
    expect(result).toEqual({
      scripts: [{ source: 'native', path: handlerDefault }],
      runScripts: true,
    });
  });

  it('returns fallthrough for unexpected cfg type', () => {
    const result = resolveScripts(
      42 as unknown as EventConfig,
      handlerDefault,
      baseScripts
    );
    expect(result).toEqual({ scripts: [], runScripts: false });
  });
});

describe('mergeClaudeScripts', () => {
  const base: ScriptEntry[] = [{ source: 'native', path: 'base.sh' }];

  it('returns base scripts when no claude scripts for event', () => {
    const result = mergeClaudeScripts(base, 'session.created', 'bash', {});
    expect(result).toBe(base);
  });

  it('returns base scripts when claude scripts array is empty', () => {
    const result = mergeClaudeScripts(base, 'session.created', 'bash', {
      'session.created': [],
    });
    expect(result).toBe(base);
  });

  it('appends claude scripts when no toolName provided', () => {
    const claudeEntry: ScriptEntry = { source: 'claude', path: 'claude.sh' };
    const result = mergeClaudeScripts(base, 'session.created', undefined, {
      'session.created': [claudeEntry],
    });
    expect(result).toEqual([...base, claudeEntry]);
  });

  it('filters claude scripts by matcher when toolName is provided', () => {
    const matching: ScriptEntry = {
      source: 'claude',
      path: 'match.sh',
      matcher: 'bash',
    };
    const nonMatching: ScriptEntry = {
      source: 'claude',
      path: 'no-match.sh',
      matcher: 'node',
    };
    const result = mergeClaudeScripts(base, 'tool.execute.before', 'bash', {
      'tool.execute.before': [matching, nonMatching],
    });
    expect(result).toEqual([...base, matching]);
  });

  it('includes claude scripts without matcher when toolName is provided', () => {
    const noMatcher: ScriptEntry = { source: 'claude', path: 'any.sh' };
    const result = mergeClaudeScripts(base, 'session.created', 'bash', {
      'session.created': [noMatcher],
    });
    expect(result).toEqual([...base, noMatcher]);
  });

  it('returns base scripts when filtered claude scripts are empty', () => {
    const nonMatching: ScriptEntry = {
      source: 'claude',
      path: 'no-match.sh',
      matcher: 'node',
    };
    const result = mergeClaudeScripts(base, 'session.created', 'bash', {
      'session.created': [nonMatching],
    });
    expect(result).toBe(base);
  });

  it('handles invalid regex matcher gracefully (returns false)', () => {
    const badMatcher: ScriptEntry = {
      source: 'claude',
      path: 'bad.sh',
      matcher: '[',
    };
    const result = mergeClaudeScripts(base, 'session.created', 'bash', {
      'session.created': [badMatcher],
    });
    expect(result).toBe(base);
  });
});
