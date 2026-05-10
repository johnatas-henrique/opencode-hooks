import { describe, it, expect } from 'vitest';
import { userConfig } from '.opencode/plugins/config/settings';

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

  it('has audit config', () => {
    expect(userConfig.audit.enabled).toBe(true);
    expect(userConfig.audit.level).toBe('debug');
    expect(userConfig.audit.basePath).toBe('./production/session-logs');
    expect(userConfig.audit.maxSizeMB).toBe(1);
    expect(userConfig.audit.maxAgeDays).toBe(30);
  });

  it('has events with specific session events enabled', () => {
    const events = userConfig.events;

    expect(events['session.created']).toEqual({
      runScripts: true,
      runOnlyOnce: true,
      appendToSession: true,
      scripts: [
        { source: 'native', path: 'mempalace-wake.sh' },
        { source: 'native', path: 'session-created.sh' },
      ],
    });

    expect(events['session.compacted']).toEqual({ toast: true });
    expect(events['session.diff']).toEqual({ enabled: false });
    expect(events['session.status']).toEqual({ enabled: false });
    expect(events['session.idle']).toEqual({});
    expect(events['session.error']).toEqual({ toast: true });
  });

  it('has message events all disabled', () => {
    const events = userConfig.events;
    expect(events['message.part.delta']).toEqual({ enabled: false });
    expect(events['message.part.removed']).toEqual({ enabled: false });
    expect(events['message.part.updated']).toEqual({ enabled: false });
    expect(events['message.removed']).toEqual({ enabled: false });
    expect(events['message.updated']).toEqual({ enabled: false });
  });

  it('has chat.message and chat.params configured', () => {
    const events = userConfig.events;
    expect(events['chat.message']).toEqual({
      runScripts: true,
      scripts: [{ source: 'native', path: 'mempalace-mine.sh' }],
    });
    expect(events['chat.params']).toEqual({ enabled: false });
    expect(events['chat.headers']).toEqual({ enabled: false });
  });

  it('has tools structure for after, after.subagent, and before', () => {
    expect(userConfig.tools).toHaveProperty('tool.execute.after');
    expect(userConfig.tools).toHaveProperty('tool.execute.after.subagent');
    expect(userConfig.tools).toHaveProperty('tool.execute.before');
  });

  it('has tool.execute.before with block rules', () => {
    const beforeTools = userConfig.tools['tool.execute.before'];
    expect(beforeTools).toHaveProperty('bash');
    expect(beforeTools).toHaveProperty('write');
    expect(beforeTools).toHaveProperty('read');
    expect(beforeTools).toHaveProperty('edit');
    expect(beforeTools).toHaveProperty('filesystem_read_file');
  });

  it('has tool.execute.after.subagent with task config', () => {
    const subagentTools = userConfig.tools['tool.execute.after.subagent'];
    expect(subagentTools).toHaveProperty('task');
    expect(subagentTools.task).toEqual({});
  });

  it('has installation.updated with toast:true', () => {
    expect(userConfig.events['installation.updated']).toEqual({ toast: true });
  });

  it('has lsp events disabled', () => {
    expect(userConfig.events['lsp.client.diagnostics']).toEqual({
      enabled: false,
    });
    expect(userConfig.events['lsp.updated']).toEqual({ enabled: false });
  });
});
