import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  stripJsonComments,
  readJsonc,
  deepMerge,
  loadUserConfig,
} from '.opencode/plugins/config/jsonc-loader';
import { createUserConfig } from '../../helpers/create-config';
import { defaultUserConfig } from '.opencode/plugins/config/defaults';
import os from 'os';

const { mockReadFileSync, mockExistsSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
  mockExistsSync: vi.fn(),
}));

vi.mock('fs', () => ({
  readFileSync: mockReadFileSync,
  existsSync: mockExistsSync,
  default: { readFileSync: mockReadFileSync, existsSync: mockExistsSync },
}));

describe('jsonc-loader', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockReadFileSync.mockReset();
    mockExistsSync.mockReset();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('stripJsonComments', () => {
    it('returns empty string for empty input', () => {
      expect(stripJsonComments('')).toBe('');
    });

    it('preserves plain JSON without comments', () => {
      expect(stripJsonComments('{"key": "value"}')).toBe('{"key": "value"}');
    });

    it('removes single-line comments', () => {
      const result = stripJsonComments('{\n  // comment\n  "key": "value"\n}');
      expect(JSON.parse(result)).toEqual({ key: 'value' });
    });

    it('removes multi-line comments', () => {
      const result = stripJsonComments(
        '{\n  /* comment */\n  "key": "value"\n}'
      );
      expect(JSON.parse(result)).toEqual({ key: 'value' });
    });

    it('preserves // inside strings', () => {
      const input = '{"url": "https://example.com"}';
      expect(stripJsonComments(input)).toBe(input);
      expect(JSON.parse(stripJsonComments(input))).toEqual({
        url: 'https://example.com',
      });
    });

    it('preserves /* inside strings', () => {
      const input = '{"regex": "test/*"}';
      expect(stripJsonComments(input)).toBe(input);
      expect(JSON.parse(stripJsonComments(input))).toEqual({ regex: 'test/*' });
    });

    it('preserves */ inside strings', () => {
      const input = '{"end": "something*/test"}';
      expect(stripJsonComments(input)).toBe(input);
      expect(JSON.parse(stripJsonComments(input))).toEqual({
        end: 'something*/test',
      });
    });

    it('preserves escaped quotes in strings', () => {
      const input = '{"msg": "he said \\"hello//world\\""}';
      expect(stripJsonComments(input)).toBe(input);
      expect(JSON.parse(stripJsonComments(input))).toEqual({
        msg: 'he said "hello//world"',
      });
    });

    it('handles mixed comments', () => {
      const result = stripJsonComments(
        '{\n  // line\n  "a": 1,\n  /* block */\n  "b": 2\n}'
      );
      expect(JSON.parse(result)).toEqual({ a: 1, b: 2 });
    });

    it('handles consecutive single-line comments', () => {
      const result = stripJsonComments(
        '{\n  // first\n  // second\n  "k": 1\n}'
      );
      expect(JSON.parse(result)).toEqual({ k: 1 });
    });

    it('handles URL with https:// inside a string value', () => {
      const input = '{"$schema": "https://example.com/schema.json#", "a": 1}';
      expect(stripJsonComments(input)).toBe(input);
      expect(JSON.parse(stripJsonComments(input))).toEqual({
        $schema: 'https://example.com/schema.json#',
        a: 1,
      });
    });

    it('handles JSON with string containing comment-like text', () => {
      const input = '{"code": "x = a // b"}';
      expect(stripJsonComments(input)).toBe(input);
      expect(JSON.parse(stripJsonComments(input))).toEqual({
        code: 'x = a // b',
      });
    });

    it('handles empty object', () => {
      expect(stripJsonComments('{}')).toBe('{}');
    });

    it('handles array with comments', () => {
      const result = stripJsonComments('[\n  // comment\n  1,\n  2\n]');
      expect(JSON.parse(result)).toEqual([1, 2]);
    });
  });

  describe('readJsonc', () => {
    it('returns parsed object for valid JSON', () => {
      mockReadFileSync.mockReturnValue('{"enabled": true}');
      expect(readJsonc('/any-path')).toEqual({ enabled: true });
    });

    it('returns null for file that cannot be read', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });
      expect(readJsonc('/nonexistent')).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      mockReadFileSync.mockReturnValue('{invalid}');
      expect(readJsonc('/bad')).toBeNull();
    });

    it('returns parsed object for JSONC with comments', () => {
      mockReadFileSync.mockReturnValue('{\n  // comment\n  "key": "value"\n}');
      expect(readJsonc('/jsonc')).toEqual({ key: 'value' });
    });
  });

  describe('deepMerge', () => {
    const base = createUserConfig({
      pluginStatusDisplayMode: 'all-labeled',
      toastQueue: { staggerMs: 300, maxSize: 50 },
      audit: {
        ...createUserConfig().audit,
        basePath: './logs',
        files: { ...createUserConfig().audit.files, events: 'events.json' },
      },
      default: {
        toast: false,
        runScripts: false,
        runOnlyOnce: false,
        logToAudit: true,
        appendToSession: false,
      },
      events: { 'session.created': { enabled: true } },
      tools: {
        'tool.execute.after': { bash: {} },
        'tool.execute.after.subagent': { task: {} },
        'tool.execute.before': { bash: {} },
        'tool.execute.before.subagent': { task: {} },
      },
    });

    it('returns base when override is empty', () => {
      const result = deepMerge(base, {});
      expect(result).toEqual(base);
    });

    it('overrides simple boolean fields', () => {
      const result = deepMerge(base, {
        enabled: false,
        logDisabledEvents: true,
      });
      expect(result.enabled).toBe(false);
      expect(result.logDisabledEvents).toBe(true);
    });

    it('overrides string fields', () => {
      const result = deepMerge(base, {
        pluginStatusDisplayMode: 'user-separated',
      });
      expect(result.pluginStatusDisplayMode).toBe('user-separated');
    });

    it('overrides showPluginStatus', () => {
      const result = deepMerge(base, { showPluginStatus: false });
      expect(result.showPluginStatus).toBe(false);
    });

    it('replaces toastQueue when overridden', () => {
      const result = deepMerge(base, {
        toastQueue: { staggerMs: 500, maxSize: 100 },
      });
      expect(result.toastQueue).toEqual({ staggerMs: 500, maxSize: 100 });
    });

    it('replaces loadClaudeHookSettings when overridden', () => {
      const result = deepMerge(base, {
        loadClaudeHookSettings: {
          loadGlobalClaudeHooks: true,
          loadLocalClaudeHooks: false,
        },
      });
      expect(result.loadClaudeHookSettings).toEqual({
        loadGlobalClaudeHooks: true,
        loadLocalClaudeHooks: false,
      });
    });

    it('replaces scriptToasts when overridden', () => {
      const result = deepMerge(base, {
        scriptToasts: {
          showOutput: false,
          showError: false,
          outputVariant: 'warning',
          errorVariant: 'error',
          outputDuration: 3000,
          errorDuration: 3000,
          outputTitle: 'Custom',
          errorTitle: 'Custom',
        },
      });
      expect(result.scriptToasts.showOutput).toBe(false);
    });

    it('replaces default config when overridden', () => {
      const result = deepMerge(base, {
        default: {
          toast: true,
          runScripts: true,
          runOnlyOnce: false,
          logToAudit: false,
          appendToSession: false,
        },
      });
      expect(result.default.toast).toBe(true);
      expect(result.default.runScripts).toBe(true);
    });

    it('replaces audit section when overridden', () => {
      const overrideAudit = {
        ...base.audit,
        basePath: './new-logs',
        files: { ...base.audit.files, errors: 'errors.log' },
      };
      const result = deepMerge(base, { audit: overrideAudit });
      expect(result.audit.basePath).toBe('./new-logs');
      expect(result.audit.files.events).toBe('events.json');
      expect(result.audit.files.errors).toBe('errors.log');
    });

    it('extends events instead of replacing', () => {
      const result = deepMerge(base, {
        events: { 'session.deleted': { enabled: true } },
      });
      expect(result.events['session.created']).toEqual({ enabled: true });
      expect(result.events['session.deleted']).toEqual({ enabled: true });
    });

    it('deep merges tools sections', () => {
      const result = deepMerge(base, {
        tools: {
          'tool.execute.after': { write: {} },
          'tool.execute.after.subagent': {},
          'tool.execute.before': { read: { logToAudit: true } },
          'tool.execute.before.subagent': {},
        },
      });
      expect(result.tools['tool.execute.after']).toEqual({
        bash: {},
        write: {},
      });
      expect(result.tools['tool.execute.before']).toEqual({
        bash: {},
        read: { logToAudit: true },
      });
    });

    it('preserves base tool sections when override only provides partial tools', () => {
      const result = deepMerge(base, {
        tools: {
          'tool.execute.before': { read: { runScripts: true } },
        },
      } as unknown as Parameters<typeof deepMerge>[1]);
      expect(result.tools['tool.execute.after']).toEqual({ bash: {} });
      expect(result.tools['tool.execute.after.subagent']).toEqual({ task: {} });
      expect(result.tools['tool.execute.before']).toEqual({
        bash: {},
        read: { runScripts: true },
      });
      expect(result.tools['tool.execute.before.subagent']).toEqual({
        task: {},
      });
    });
  });

  describe('loadUserConfig', () => {
    it('returns defaults when no config files exist', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });
      mockExistsSync.mockReturnValue(false);
      const result = loadUserConfig();
      expect(result).toEqual(defaultUserConfig);
    });

    it('logs error with correct paths when both files fail to parse', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });
      mockExistsSync.mockReturnValue(true);
      const result = loadUserConfig();
      expect(result).toEqual(defaultUserConfig);
      expect(consoleSpy).toHaveBeenCalledOnce();
      const msg = consoleSpy.mock.calls[0][0];
      expect(msg).toContain('project(');
      expect(msg).toContain('global(');
    });

    it('logs error with only project path when only project fails', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });
      mockExistsSync.mockImplementation((p: string) => p.includes('.opencode'));
      loadUserConfig();
      const msg = consoleSpy.mock.calls[0][0];
      expect(msg).toContain('project(');
      expect(msg).not.toContain('global(');
    });

    it('logs error with only global path when only global fails', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });
      mockExistsSync.mockImplementation((p: string) =>
        p.includes('.config/opencode')
      );
      loadUserConfig();
      const msg = consoleSpy.mock.calls[0][0];
      expect(msg).toContain('global(');
      expect(msg).not.toContain('project(');
    });

    it('merges global config with defaults', () => {
      mockReadFileSync.mockImplementation((p: string) => {
        if (p.includes(os.homedir()) && p.includes('.config'))
          return '{"enabled": false}';
        throw new Error('ENOENT');
      });
      mockExistsSync.mockImplementation((p: string) =>
        p.includes(os.homedir())
      );
      const result = loadUserConfig();
      expect(result.enabled).toBe(false);
    });

    it('merges project config with defaults', () => {
      mockReadFileSync.mockImplementation((p: string) => {
        if (p.includes('.opencode')) return '{"logDisabledEvents": true}';
        throw new Error('ENOENT');
      });
      mockExistsSync.mockImplementation((p: string) => p.includes('.opencode'));
      const result = loadUserConfig();
      expect(result.logDisabledEvents).toBe(true);
    });

    it('merges global then project with project winning', () => {
      mockReadFileSync.mockImplementation((p: string) => {
        if (p.includes('.config/opencode')) return '{"enabled": false}';
        if (p.includes('.opencode')) return '{"enabled": true}';
        throw new Error('ENOENT');
      });
      mockExistsSync.mockReturnValue(true);
      const result = loadUserConfig();
      expect(result.enabled).toBe(true);
    });

    it('uses custom defaults when provided', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });
      mockExistsSync.mockReturnValue(false);
      const customDefaults = createUserConfig({
        enabled: false,
        logDisabledEvents: true,
      });
      const result = loadUserConfig(customDefaults);
      expect(result.enabled).toBe(false);
      expect(result.logDisabledEvents).toBe(true);
    });
  });
});
