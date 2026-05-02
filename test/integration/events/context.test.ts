import type { ConfigResolverContext } from '.opencode/plugins/types/events';
import {
  createContext,
  createFactory,
} from '.opencode/plugins/features/events/context';
import type { UserEventsConfig } from '.opencode/plugins/types/config';
import { createTestUserConfig } from '../../../helpers/create-config';

vi.mock('.opencode/plugins/config/claude-settings', () => ({
  loadClaudeSettings: vi.fn().mockReturnValue({
    hooks: {
      'tool.execute.before': [{ source: 'claude', path: 'claude-hook.sh' }],
    },
    unsupported: ['Notification'],
  }),
}));

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
        claudeScripts: {},
        claudeUnsupported: [],
      };

      const factory = createFactory(mockContext);
      const eventResolver = factory.createEventResolver(mockContext);
      const toolResolver = factory.createToolResolver(mockContext);

      expect(eventResolver).toBeDefined();
      expect(toolResolver).toBeDefined();
    });
  });

  describe('createContext', () => {
    it('loads claude scripts when enabled', () => {
      const userConfig = createTestUserConfig({
        loadClaudeHookSettings: { enabled: true },
      });

      const context = createContext(userConfig, {});
      expect(context.claudeScripts['tool.execute.before']).toHaveLength(1);
      expect(context.claudeScripts['tool.execute.before'][0].path).toBe(
        'claude-hook.sh'
      );
      expect(context.claudeUnsupported).toContain('Notification');
    });
    it('does not load claude scripts when disabled', () => {
      const userConfig = createTestUserConfig({
        loadClaudeHookSettings: { enabled: false },
      });

      const context = createContext(userConfig, {});
      expect(context.claudeScripts).toEqual({});
      expect(context.claudeUnsupported).toEqual([]);
    });
  });
});
