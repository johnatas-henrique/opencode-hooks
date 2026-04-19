import type { ConfigResolverContext } from '../../.opencode/plugins/types/events';
import type { Mock } from 'vitest';
import { ToolConfigResolverImpl } from '../../.opencode/plugins/features/events/resolvers/tool-config.resolver';

describe('ToolConfigResolverImpl', () => {
  const createMockContext = (
    overrides?: Partial<ConfigResolverContext>
  ): ConfigResolverContext => ({
    enabled: true,
    default: {
      enabled: true,
      toast: true,
      debug: false,
      runScripts: false,
      saveToFile: true,
      appendToSession: false,
    },
    scriptToasts: {
      showOutput: true,
      showError: true,
      outputVariant: 'info',
      errorVariant: 'error',
      outputDuration: 5000,
      errorDuration: 15000,
      outputTitle: 'Output',
      errorTitle: 'Error',
    },
    handlers: {
      'tool.execute.after': {
        title: 'Tool After',
        variant: 'info' as const,
        duration: 2000,
        defaultScript: 'tool-after.sh',
        buildMessage: () => 'Tool After Message',
      },
      'tool.execute.after.bash': {
        title: 'Bash After',
        variant: 'info' as const,
        duration: 2000,
        defaultScript: 'bash-after.sh',
        buildMessage: () => 'Bash After Message',
      },
    },
    getEventConfig: vi.fn(),
    getToolConfigs: vi.fn(),
    ...overrides,
  });

  describe('resolve()', () => {
    it('should return disabled config when toolConfig is false', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getToolConfigs as Mock).mockReturnValue({ myTool: false });

      const result = resolver.resolve('tool.execute.after', 'myTool');

      expect(result.enabled).toBe(false);
      expect(result.toast).toBe(false); // explicitly disabled
      expect(result.scripts).toEqual([]);
    });

    it('should use eventBase.runScripts when toolHandler has defaultScript', () => {
      const context = createMockContext({
        default: {
          enabled: true,
          toast: true,
          debug: false,
          runScripts: true,
          saveToFile: true,
          appendToSession: false,
        },
      });
      context.handlers['tool.execute.after.bash'] = {
        title: 'Bash After',
        variant: 'info' as const,
        duration: 2000,
        defaultScript: 'bash-after.sh',
        buildMessage: () => 'Bash After Message',
      };
      const resolver = new ToolConfigResolverImpl(context);

      (context.getToolConfigs as Mock).mockReturnValue({});
      (context.getEventConfig as Mock).mockReturnValue(undefined);

      const result = resolver.resolve('tool.execute.after', 'bash');

      expect(result.runScripts).toBe(true);
      expect(result.scripts).toContain('bash-after.sh');
    });
  });

  describe('resolveBase()', () => {
    it('should return base config with toast override from eventConfig', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getEventConfig as Mock).mockReturnValue({
        toast: {
          title: 'Event Title',
          variant: 'error' as const,
          duration: 5000,
        },
      });

      const result = (
        resolver as unknown as {
          resolveBase: (
            eventType: string,
            input: Record<string, unknown>
          ) => unknown;
        }
      ).resolveBase('tool.execute.after', {});

      expect((result as Record<string, unknown>).toastTitle).toBe(
        'Event Title'
      );
      expect((result as Record<string, unknown>).toastVariant).toBe('error');
      expect((result as Record<string, unknown>).toastDuration).toBe(5000);
    });

    it('should return default values when no handler exists', () => {
      const context = createMockContext({
        handlers: {},
      });
      const resolver = new ToolConfigResolverImpl(context);

      (context.getEventConfig as Mock).mockReturnValue(undefined);

      const result = (
        resolver as unknown as {
          resolveBase: (
            eventType: string,
            input: Record<string, unknown>
          ) => unknown;
        }
      ).resolveBase('unknown.event', {});

      expect((result as Record<string, unknown>).toastTitle).toBe('');
      expect((result as Record<string, unknown>).toastVariant).toBe('info');
      expect((result as Record<string, unknown>).toastDuration).toBe(2000);
      expect((result as Record<string, unknown>).toastMessage).toBe('');
    });
  });

  describe('tryBuildMessage()', () => {
    it('should return empty string when handler.buildMessage throws', () => {
      const context = createMockContext();
      context.handlers['tool.execute.after'] = {
        title: 'Error Tool',
        variant: 'info' as const,
        duration: 2000,
        defaultScript: 'error.sh',
        buildMessage: () => {
          throw new Error('Boom');
        },
      };
      const resolver = new ToolConfigResolverImpl(context);

      (context.getToolConfigs as Mock).mockReturnValue({
        myTool: { enabled: true },
      });
      (context.getEventConfig as Mock).mockReturnValue(undefined);

      const result = resolver.resolve('tool.execute.after', 'myTool');
      expect(result.toastMessage).toBe('');
    });
  });
});
