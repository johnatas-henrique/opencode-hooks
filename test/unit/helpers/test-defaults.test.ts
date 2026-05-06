import { describe, it, expect } from 'vitest';
import {
  MOCK_TITLE,
  MOCK_VARIANT,
  MOCK_DURATION,
  MOCK_SCRIPT,
  MOCK_EVENT_TYPE,
  MOCK_TOOL_NAME,
  MOCK_SESSION_ID,
  MOCK_TIMESTAMP,
  createDefaultEventOverride,
  createMinimalHandler,
  createDefaultContext,
  MockEventResolver,
  MockToolResolver,
} from '../helpers/test-defaults';

describe('test-defaults', () => {
  describe('constants', () => {
    it('exports correct mock values', () => {
      expect(MOCK_TITLE).toBe('test-title');
      expect(MOCK_VARIANT).toBe('info');
      expect(MOCK_DURATION).toBe(5000);
      expect(MOCK_SCRIPT).toBe('test-script.sh');
      expect(MOCK_EVENT_TYPE).toBe('session.created');
      expect(MOCK_TOOL_NAME).toBe('bash');
      expect(MOCK_SESSION_ID).toBe('ses_test123');
      expect(MOCK_TIMESTAMP).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('createDefaultEventOverride', () => {
    it('creates default event override', () => {
      const result = createDefaultEventOverride();
      expect(result.debug).toBe(false);
      expect(result.toast).toBe(false);
      expect(result.runScripts).toBe(false);
      expect(result.runOnlyOnce).toBe(false);
      expect(result.logToAudit).toBe(true);
      expect(result.appendToSession).toBe(false);
    });

    it('returns same values across calls', () => {
      const first = createDefaultEventOverride();
      const second = createDefaultEventOverride();
      expect(first).toEqual(second);
    });
  });

  describe('createMinimalHandler', () => {
    it('creates handler with default values', () => {
      const handler = createMinimalHandler();
      expect(handler.title).toBe(MOCK_TITLE);
      expect(handler.variant).toBe(MOCK_VARIANT);
      expect(handler.duration).toBe(MOCK_DURATION);
      expect(handler.defaultScript).toBe(MOCK_SCRIPT);
      expect(handler.buildMessage({})).toBe('test-message');
    });

    it('allows overrides', () => {
      const handler = createMinimalHandler({
        title: 'custom-title',
        variant: 'error',
        duration: 1000,
      });
      expect(handler.title).toBe('custom-title');
      expect(handler.variant).toBe('error');
      expect(handler.duration).toBe(1000);
    });

    it('preserves defaultScript when not overridden', () => {
      const handler = createMinimalHandler({ title: 'new-title' });
      expect(handler.defaultScript).toBe(MOCK_SCRIPT);
    });
  });

  describe('createDefaultContext', () => {
    it('creates context with default values', () => {
      const ctx = createDefaultContext();
      expect(ctx.enabled).toBe(true);
      expect(ctx.default).toEqual(createDefaultEventOverride());
      expect(ctx.scriptToasts.showOutput).toBe(true);
      expect(ctx.scriptToasts.showError).toBe(true);
      expect(ctx.scriptToasts.outputVariant).toBe('info');
      expect(ctx.scriptToasts.errorVariant).toBe('error');
      expect(ctx.handlers).toEqual({});
      expect(ctx.getEventConfig).toBeDefined();
      expect(ctx.getToolConfigs).toBeDefined();
      expect(ctx.claudeScripts).toEqual({ global: {}, local: {}, all: {} });
      expect(ctx.claudeUnsupported).toEqual([]);
    });

    it('allows overrides', () => {
      const ctx = createDefaultContext({
        enabled: false,
        default: { debug: true },
      });
      expect(ctx.enabled).toBe(false);
      expect(ctx.default.debug).toBe(true);
    });

    it('handles custom handlers', () => {
      const customHandlers = {
        'session.created': {
          title: 'Session',
          variant: 'info' as const,
          duration: 3000,
          defaultScript: 'session.sh',
          buildMessage: (_event: Record<string, unknown>) => 'Custom message',
        },
      };
      const ctx = createDefaultContext({ handlers: customHandlers });
      expect(ctx.handlers).toEqual(customHandlers);
    });

    it('handles custom getEventConfig', () => {
      const getEventConfig = () => ({ enabled: false });
      const ctx = createDefaultContext({ getEventConfig });
      expect(ctx.getEventConfig('session.created')).toEqual({ enabled: false });
    });

    it('handles custom getToolConfigs', () => {
      const getToolConfigs = (toolName: string) => ({
        [toolName]: { enabled: true },
      });
      const ctx = createDefaultContext({
        getToolConfigs: getToolConfigs as never,
      });
      const result = ctx.getToolConfigs('bash');
      expect(result).toHaveProperty('bash');
    });

    it('handles custom claudeScripts', () => {
      const claudeScripts = {
        global: {},
        local: {},
        all: {
          pre_task: [
            { source: 'native' as const, path: 'pre-task.sh', timeout: 5000 },
          ],
        },
      };
      const ctx = createDefaultContext({ claudeScripts });
      expect(ctx.claudeScripts).toEqual(claudeScripts);
    });

    it('handles custom claudeUnsupported', () => {
      const ctx = createDefaultContext({
        claudeUnsupported: ['tool1', 'tool2'],
      });
      expect(ctx.claudeUnsupported).toEqual(['tool1', 'tool2']);
    });
  });

  describe('MockEventResolver', () => {
    it('creates instance', () => {
      const resolver = new MockEventResolver();
      expect(resolver).toBeInstanceOf(MockEventResolver);
    });

    it('resolve returns default config', () => {
      const resolver = new MockEventResolver();
      const result = resolver.resolve();
      expect(result.enabled).toBe(true);
      expect(result.debug).toBe(false);
      expect(result.toast).toBe(false);
      expect(result.toastTitle).toBe('');
      expect(result.toastMessage).toBe('');
      expect(result.toastVariant).toBe('info');
      expect(result.toastDuration).toBe(2000);
      expect(result.scripts).toEqual([]);
      expect(result.runScripts).toBe(false);
      expect(result.logToAudit).toBe(true);
      expect(result.appendToSession).toBe(false);
      expect(result.runOnlyOnce).toBe(false);
      expect(result.scriptToasts).toBeDefined();
    });

    it('resolve returns consistent results', () => {
      const resolver = new MockEventResolver();
      const first = resolver.resolve();
      const second = resolver.resolve();
      expect(first).toEqual(second);
    });
  });

  describe('MockToolResolver', () => {
    it('creates instance', () => {
      const resolver = new MockToolResolver();
      expect(resolver).toBeInstanceOf(MockToolResolver);
    });

    it('resolve returns default config', () => {
      const resolver = new MockToolResolver();
      const result = resolver.resolve();
      expect(result.enabled).toBe(true);
      expect(result.debug).toBe(false);
      expect(result.toast).toBe(false);
      expect(result.toastTitle).toBe('');
      expect(result.toastMessage).toBe('');
      expect(result.toastVariant).toBe('info');
      expect(result.toastDuration).toBe(2000);
      expect(result.scripts).toEqual([]);
      expect(result.runScripts).toBe(false);
      expect(result.logToAudit).toBe(true);
      expect(result.appendToSession).toBe(false);
      expect(result.runOnlyOnce).toBe(false);
      expect(result.scriptToasts).toBeDefined();
    });

    it('resolve returns consistent results', () => {
      const resolver = new MockToolResolver();
      const first = resolver.resolve();
      const second = resolver.resolve();
      expect(first).toEqual(second);
    });

    it('has same structure as MockEventResolver', () => {
      const eventResolver = new MockEventResolver();
      const toolResolver = new MockToolResolver();
      expect(eventResolver.resolve()).toEqual(toolResolver.resolve());
    });
  });
});
