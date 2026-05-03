import { describe, it, expect, vi } from 'vitest';

vi.mock('.opencode/plugins/config/settings', () => ({
  userConfig: {
    enabled: true,
    logDisabledEvents: false,
    showPluginStatus: true,
    pluginStatusDisplayMode: 'user-only',
    loadClaudeHookSettings: { enabled: false },
    scriptToasts: {
      showOutput: true,
      showError: true,
      outputVariant: 'info',
      errorVariant: 'error',
      outputDuration: 5000,
      errorDuration: 15000,
      outputTitle: 'Script Output',
      errorTitle: 'Script Error',
    },
    default: {
      debug: false,
      toast: false,
      runScripts: false,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: false,
    },
    audit: {
      enabled: true,
      level: 'debug',
      basePath: '/tmp',
      maxSizeMB: 1,
      maxAgeDays: 30,
      logTruncationKB: 10,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: ['patch', 'diff'],
    },
    events: {},
    tools: {
      'tool.execute.after': {},
      'tool.execute.after.subagent': {},
      'tool.execute.before': {},
    },
  },
}));

import {
  resolveEventConfig,
  resolveToolConfig,
} from '.opencode/plugins/features/events/events';

describe('events', () => {
  describe('resolveEventConfig', () => {
    it('resolves config for known event type', () => {
      const result = resolveEventConfig('session.created');
      expect(result.enabled).toBe(true);
      expect(typeof result.toast).toBe('boolean');
    });

    it('resolves config for unknown event type with defaults', () => {
      const result = resolveEventConfig('custom.event');
      expect(result).toBeDefined();
      expect(result.enabled).toBe(true);
    });
  });

  describe('resolveToolConfig', () => {
    it('resolves tool config for known tool', () => {
      const result = resolveToolConfig('tool.execute.before', 'bash', {
        tool: 'bash',
        sessionID: 'ses_1',
        callID: 'call_1',
      });
      expect(result).toBeDefined();
      expect(result.enabled).toBe(true);
    });
  });
});
