import {
  createFactory,
  createEventResolver,
  createToolResolver,
} from '../../.opencode/plugins/features/events/context';
import type { ConfigResolverContext } from '../../.opencode/plugins/features/events/interfaces';
import type { UserEventsConfig } from '../../.opencode/plugins/types/config';

describe('context exports', () => {
  describe('createFactory', () => {
    it('should create factory with createEventResolver and createToolResolver', () => {
      const mockContext: ConfigResolverContext = {
        enabled: true,
        default: { toast: true },
        scriptToasts: { showOutput: true } as never,
        handlers: {},
        getEventConfig: () => undefined,
        getToolConfigs: () => ({}),
      };

      const factory = createFactory(mockContext);

      expect(factory.createEventResolver).toBeDefined();
      expect(factory.createToolResolver).toBeDefined();
      expect(typeof factory.createEventResolver).toBe('function');
      expect(typeof factory.createToolResolver).toBe('function');
    });

    it('should create event resolver from factory', () => {
      const mockContext: ConfigResolverContext = {
        enabled: true,
        default: { toast: true },
        scriptToasts: { showOutput: true } as never,
        handlers: {},
        getEventConfig: () => undefined,
        getToolConfigs: () => ({}),
      };

      const factory = createFactory(mockContext);
      const resolver = factory.createEventResolver(mockContext);

      expect(resolver).toBeDefined();
      expect(typeof resolver.resolve).toBe('function');
    });

    it('should create tool resolver from factory', () => {
      const mockContext: ConfigResolverContext = {
        enabled: true,
        default: { toast: true },
        scriptToasts: { showOutput: true } as never,
        handlers: {},
        getEventConfig: () => undefined,
        getToolConfigs: () => ({}),
      };

      const factory = createFactory(mockContext);
      const resolver = factory.createToolResolver(mockContext);

      expect(resolver).toBeDefined();
      expect(typeof resolver.resolve).toBe('function');
    });

    it('should pass context to resolvers', () => {
      const mockContext: ConfigResolverContext = {
        enabled: false,
        default: { toast: true },
        scriptToasts: { showOutput: true } as never,
        handlers: {},
        getEventConfig: () => undefined,
        getToolConfigs: () => ({}),
      };

      const factory = createFactory(mockContext);
      const eventResolver = factory.createEventResolver(mockContext);
      const toolResolver = factory.createToolResolver(mockContext);

      expect(eventResolver).toBeDefined();
      expect(toolResolver).toBeDefined();
    });
  });

  describe('createEventResolver', () => {
    it('should create event resolver from user config', () => {
      const mockConfig: UserEventsConfig = {
        enabled: true,
        default: { toast: true },
        events: {},
        tools: {} as never,
        logDisabledEvents: false,
        showPluginStatus: true,
        pluginStatusDisplayMode: 'user-only',
        scriptToasts: { showOutput: true } as never,
      };

      const resolver = createEventResolver(mockConfig);

      expect(resolver).toBeDefined();
      expect(typeof resolver.resolve).toBe('function');
    });
  });

  describe('createToolResolver', () => {
    it('should create tool resolver from user config', () => {
      const mockConfig: UserEventsConfig = {
        enabled: true,
        default: { toast: true },
        events: {},
        tools: {} as never,
        logDisabledEvents: false,
        showPluginStatus: true,
        pluginStatusDisplayMode: 'user-only',
        scriptToasts: { showOutput: true } as never,
      };

      const resolver = createToolResolver(mockConfig);

      expect(resolver).toBeDefined();
      expect(typeof resolver.resolve).toBe('function');
    });
  });
});
