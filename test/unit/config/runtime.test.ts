import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defaultUserConfig } from '.opencode/plugins/config/defaults';

const { mockExistsSync, mockWriteFileSync, mockMkdirSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn().mockReturnValue(true),
  mockWriteFileSync: vi.fn(),
  mockMkdirSync: vi.fn(),
}));

vi.mock('fs', () => ({
  existsSync: mockExistsSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
  default: {
    existsSync: mockExistsSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: mockMkdirSync,
  },
}));

vi.mock('.opencode/plugins/config/jsonc-loader', () => ({
  loadUserConfig: () => defaultUserConfig,
  getConfigPaths: () => ({
    projectPath: '/project/.opencode/opencode-hooks.jsonc',
    globalPath: '/home/.config/opencode/opencode-hooks.jsonc',
  }),
}));

import {
  userConfig,
  hasAnyConfigFile,
  writeDefaultConfig,
} from '.opencode/plugins/config/runtime';

describe('userConfig', () => {
  it('has top-level structure', () => {
    expect(userConfig).toHaveProperty('enabled');
    expect(userConfig).toHaveProperty('logDisabledEvents');
    expect(userConfig).toHaveProperty('showPluginStatus');
    expect(userConfig).toHaveProperty('pluginStatusDisplayMode');
    expect(userConfig).toHaveProperty('loadClaudeHookSettings');
    expect(userConfig).toHaveProperty('scriptToasts');
    expect(userConfig).toHaveProperty('default');
    expect(userConfig).toHaveProperty('audit');
    expect(userConfig).toHaveProperty('events');
    expect(userConfig).toHaveProperty('tools');
  });

  it('enabled is true', () => {
    expect(userConfig.enabled).toBe(true);
  });

  it('pluginStatusDisplayMode is user-only', () => {
    expect(userConfig.pluginStatusDisplayMode).toBe('user-only');
  });

  it('has scriptToasts with correct values', () => {
    expect(userConfig.scriptToasts.showOutput).toBe(true);
    expect(userConfig.scriptToasts.showError).toBe(true);
    expect(userConfig.scriptToasts.outputVariant).toBe('warning');
    expect(userConfig.scriptToasts.errorVariant).toBe('error');
    expect(userConfig.scriptToasts.outputDuration).toBe(5000);
    expect(userConfig.scriptToasts.errorDuration).toBe(15000);
    expect(userConfig.scriptToasts.outputTitle).toBe('- SCRIPTS OUTPUT');
    expect(userConfig.scriptToasts.errorTitle).toBe('- SCRIPT ERROR');
  });

  it('has default overrides', () => {
    expect(userConfig.default.toast).toBe(false);
    expect(userConfig.default.runScripts).toBe(false);
    expect(userConfig.default.runOnlyOnce).toBe(false);
    expect(userConfig.default.logToAudit).toBe(true);
    expect(userConfig.default.appendToSession).toBe(false);
  });

  it('has audit config from defaults', () => {
    expect(userConfig.audit.enabled).toBe(true);
    expect(userConfig.audit.level).toBe('debug');
    expect(userConfig.audit.basePath).toBe('./opencode-hooks/logs');
    expect(userConfig.audit.maxSizeMB).toBe(1);
    expect(userConfig.audit.maxAgeDays).toBe(30);
  });

  it('has all events disabled by default', () => {
    expect(Object.keys(userConfig.events).length).toBe(50);
    for (const [, config] of Object.entries(userConfig.events)) {
      if (
        typeof config === 'object' &&
        config !== null &&
        'enabled' in config
      ) {
        expect(config.enabled).toBe(false);
      }
    }
  });

  it('has tools structure for after, after.subagent, before, before.subagent', () => {
    expect(userConfig.tools).toHaveProperty('tool.execute.after');
    expect(userConfig.tools).toHaveProperty('tool.execute.after.subagent');
    expect(userConfig.tools).toHaveProperty('tool.execute.before');
    expect(userConfig.tools).toHaveProperty('tool.execute.before.subagent');
  });

  it('has empty tool configs by default', () => {
    expect(Object.keys(userConfig.tools['tool.execute.after']).length).toBe(0);
    expect(
      Object.keys(userConfig.tools['tool.execute.after.subagent']).length
    ).toBe(0);
    expect(Object.keys(userConfig.tools['tool.execute.before']).length).toBe(0);
    expect(
      Object.keys(userConfig.tools['tool.execute.before.subagent']).length
    ).toBe(0);
  });

  it('does not create config file when it exists', () => {
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });
});

describe('hasAnyConfigFile', () => {
  it('returns true when project config exists', () => {
    mockExistsSync.mockImplementation(
      (path: string) => path === '/project/.opencode/opencode-hooks.jsonc'
    );
    expect(hasAnyConfigFile()).toBe(true);
  });

  it('returns true when global config exists', () => {
    mockExistsSync.mockImplementation(
      (path: string) => path === '/home/.config/opencode/opencode-hooks.jsonc'
    );
    expect(hasAnyConfigFile()).toBe(true);
  });

  it('returns false when neither config exists', () => {
    mockExistsSync.mockReturnValue(false);
    expect(hasAnyConfigFile()).toBe(false);
  });
});

describe('writeDefaultConfig', () => {
  beforeEach(() => {
    mockMkdirSync.mockClear();
    mockWriteFileSync.mockClear();
  });

  const schemaUrl =
    'https://raw.githubusercontent.com/johnatas-henrique/opencode-hooks/main/assets/opencode-hooks.schema.json';

  it('writes minimal config with schema reference', () => {
    mockExistsSync.mockReturnValue(true);
    writeDefaultConfig(
      '/project/.opencode/opencode-hooks.jsonc',
      defaultUserConfig
    );

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/project/.opencode/opencode-hooks.jsonc',
      expect.any(String),
      'utf-8'
    );
    const written = mockWriteFileSync.mock.calls[0][1];
    const parsed = JSON.parse(written);
    expect(parsed.$schema).toBe(schemaUrl);
    expect(parsed.enabled).toBe(true);
    expect(parsed.loadClaudeHookSettings).toEqual({
      loadGlobalClaudeHooks: true,
      loadLocalClaudeHooks: true,
    });
    expect(parsed.events).toBeUndefined();
    expect(parsed.tools).toBeUndefined();
    expect(parsed.audit).toBeUndefined();
  });

  it('creates parent directory when missing', () => {
    mockExistsSync.mockReturnValue(false);
    writeDefaultConfig(
      '/project/.opencode/opencode-hooks.jsonc',
      defaultUserConfig
    );

    expect(mockMkdirSync).toHaveBeenCalledWith('/project/.opencode', {
      recursive: true,
    });
  });

  it('skips mkdir when directory exists', () => {
    mockExistsSync.mockReturnValue(true);
    writeDefaultConfig(
      '/project/.opencode/opencode-hooks.jsonc',
      defaultUserConfig
    );

    expect(mockMkdirSync).not.toHaveBeenCalled();
  });

  it('serializes only the minimal fields', () => {
    mockExistsSync.mockReturnValue(true);
    writeDefaultConfig('/path.jsonc', defaultUserConfig);

    const written = mockWriteFileSync.mock.calls[0][1];
    const parsed = JSON.parse(written);
    expect(Object.keys(parsed)).toEqual([
      '$schema',
      'enabled',
      'loadClaudeHookSettings',
    ]);
  });
});

describe('runtime IIFE auto-creation', () => {
  beforeEach(() => {
    mockWriteFileSync.mockClear();
    mockMkdirSync.mockClear();
  });

  it('creates config when no files exist at import time', async () => {
    mockExistsSync.mockReturnValue(false);
    vi.resetModules();
    const mod = await import('.opencode/plugins/config/runtime');

    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    expect(mockMkdirSync).toHaveBeenCalledWith('/project/.opencode', {
      recursive: true,
    });
    expect(mod.userConfig.enabled).toBe(true);
    const written = mockWriteFileSync.mock.calls[0][1];
    const parsed = JSON.parse(written);
    expect(parsed.$schema).toBe(
      'https://raw.githubusercontent.com/johnatas-henrique/opencode-hooks/main/assets/opencode-hooks.schema.json'
    );
  });

  it('skips creation when config exists at import time', async () => {
    mockExistsSync.mockReturnValue(true);
    vi.resetModules();
    mockWriteFileSync.mockClear();
    mockMkdirSync.mockClear();
    await import('.opencode/plugins/config/runtime');

    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(mockMkdirSync).not.toHaveBeenCalled();
  });
});
