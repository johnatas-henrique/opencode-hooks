import {
  createContext,
  createFactory,
  createEventResolver,
  createToolResolver,
} from '.opencode/plugins/features/events/context';
import type { UserEventsConfig } from '.opencode/plugins/types/config';
import { EventType, EventHandler } from '.opencode/plugins/types/events';

describe('context', () => {
  const baseConfig: UserEventsConfig = {
    enabled: true,
    logDisabledEvents: false,
    audit: {
      enabled: true,
      level: 'audit',
      basePath: '/tmp/test',
      maxSizeMB: 100,
      maxAgeDays: 30,
      logTruncationKB: 10,
      maxFieldSize: 1024,
      maxArrayItems: 10,
      largeFields: [],
    },
    showPluginStatus: false,
    pluginStatusDisplayMode: 'user-only',
    scriptToasts: {
      showOutput: false,
      showError: false,
      outputVariant: 'success',
      errorVariant: 'error',
      outputDuration: 3000,
      errorDuration: 5000,
      outputTitle: 'Output',
      errorTitle: 'Error',
    },
    default: { scripts: [], runScripts: false },
    loadClaudeHookSettings: { enabled: false },
    events: {},
    tools: {
      [EventType.TOOL_EXECUTE_AFTER]: {},
      [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: {},
      [EventType.TOOL_EXECUTE_BEFORE]: {},
    },
  };

  describe('createContext', () => {
    it('returns context with enabled getter', () => {
      const ctx = createContext(baseConfig);
      expect(ctx.enabled).toBe(true);
    });

    it('returns context with default getter', () => {
      const ctx = createContext(baseConfig);
      expect(ctx.default).toEqual({ scripts: [] });
    });

    it('returns context with scriptToasts getter', () => {
      const ctx = createContext(baseConfig);
      expect(ctx.scriptToasts).toEqual({ showError: false });
    });

    it('returns context with handlers getter', () => {
      const ctx = createContext(baseConfig);
      expect(ctx.handlers).toBeDefined();
    });

    it('uses provided eventHandlers when passed', () => {
      const customHandlers: Record<string, EventHandler> = {
        'test.handler': vi.fn() as unknown as EventHandler,
      };
      const ctx = createContext(baseConfig, customHandlers);
      expect(ctx.handlers).toBe(customHandlers);
    });

    it('falls back to default handlers when not provided', () => {
      const ctx = createContext(baseConfig);
      expect(ctx.handlers).toBeDefined();
      expect(typeof ctx.handlers).toBe('object');
    });

    it('returns empty claudeScripts when loadClaudeHookSettings disabled', () => {
      const ctx = createContext(baseConfig);
      expect(ctx.claudeScripts).toEqual({});
    });

    it('returns empty claudeUnsupported when loadClaudeHookSettings disabled', () => {
      const ctx = createContext(baseConfig);
      expect(ctx.claudeUnsupported).toEqual([]);
    });

    it('getEventConfig returns undefined for unknown event', () => {
      const ctx = createContext(baseConfig);
      const result = ctx.getEventConfig('unknown.event' as 'session.created');
      expect(result).toBeUndefined();
    });

    it('getToolConfigs returns undefined for unknown tool event', () => {
      const ctx = createContext(baseConfig);
      const result = ctx.getToolConfigs('unknown' as 'tool.execute.before');
      expect(result).toBeUndefined();
    });
  });

  describe('createFactory', () => {
    it('creates factory with createEventResolver', () => {
      const ctx = createContext(baseConfig);
      const factory = createFactory(ctx);
      expect(factory.createEventResolver).toBeDefined();
      expect(typeof factory.createEventResolver).toBe('function');
    });

    it('creates factory with createToolResolver', () => {
      const ctx = createContext(baseConfig);
      const factory = createFactory(ctx);
      expect(factory.createToolResolver).toBeDefined();
      expect(typeof factory.createToolResolver).toBe('function');
    });

    it('createEventResolver returns EventConfigResolver', () => {
      const ctx = createContext(baseConfig);
      const factory = createFactory(ctx);
      const resolver = factory.createEventResolver(ctx);
      expect(resolver).toBeDefined();
      expect(resolver.resolve).toBeDefined();
    });

    it('createToolResolver returns ToolConfigResolver', () => {
      const ctx = createContext(baseConfig);
      const factory = createFactory(ctx);
      const resolver = factory.createToolResolver(ctx);
      expect(resolver).toBeDefined();
      expect(resolver.resolve).toBeDefined();
    });
  });

  describe('createEventResolver', () => {
    it('creates EventConfigResolver directly', () => {
      const resolver = createEventResolver(baseConfig);
      expect(resolver).toBeDefined();
      expect(resolver.resolve).toBeDefined();
      expect(typeof resolver.resolve).toBe('function');
    });
  });

  describe('createToolResolver', () => {
    it('creates ToolConfigResolver directly', () => {
      const resolver = createToolResolver(baseConfig);
      expect(resolver).toBeDefined();
      expect(resolver.resolve).toBeDefined();
      expect(typeof resolver.resolve).toBe('function');
    });
  });
});
