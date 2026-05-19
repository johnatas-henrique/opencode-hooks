import { describe, it, expect, vi } from 'vitest';
import { defaultUserConfig } from '.opencode/plugins/config/defaults';

vi.mock('.opencode/plugins/config/jsonc-loader', () => ({
  loadUserConfig: () => defaultUserConfig,
}));

import { userConfig } from '.opencode/plugins/config/runtime';

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
});
