import type { ConfigResolverContext } from '../../.opencode/plugins/types/events';
import { createFactory } from '../../.opencode/plugins/features/events/context';

describe('context exports', () => {
  describe('createFactory', () => {
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
});
