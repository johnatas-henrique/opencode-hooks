import { ToolConfigResolverImpl } from '../../.opencode/plugins/features/events/resolvers/tool-config.resolver';
import type { ConfigResolverContext } from '../../.opencode/plugins/features/events/interfaces';

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

      (context.getToolConfigs as vi.Mock).mockReturnValue({ myTool: false });

      const result = resolver.resolve('tool.execute.after', 'myTool');

      expect(result.enabled).toBe(false);
      expect(result.toast).toBe(false); // explicitly disabled
      expect(result.scripts).toEqual([]);
    });

    it('should use default config when no toolConfig', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getToolConfigs as vi.Mock).mockReturnValue(undefined);

      const result = resolver.resolve('tool.execute.after', 'myTool');

      expect(result.enabled).toBe(true);
      expect(result.toast).toBe(true);
    });

    it('should use toolHandler when eventType contains .before', () => {
      const context = createMockContext();
      context.handlers['tool.execute.before.bash'] = {
        title: 'Bash Before',
        variant: 'warning' as const,
        duration: 3000,
        defaultScript: 'bash-before.sh',
        buildMessage: () => 'Bash Before Message',
      };
      const resolver = new ToolConfigResolverImpl(context);

      (context.getToolConfigs as vi.Mock).mockReturnValue({});
      (context.getEventConfig as vi.Mock).mockReturnValue({ toast: true });

      const result = resolver.resolve('tool.execute.before', 'bash');

      expect(result.toastTitle).toBe('Bash Before');
      expect(result.toastVariant).toBe('warning');
    });

    it('should use toolHandler when eventType contains .after', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getToolConfigs as vi.Mock).mockReturnValue({});
      (context.getEventConfig as vi.Mock).mockReturnValue({ toast: true });

      const result = resolver.resolve('tool.execute.after', 'bash');

      expect(result.toastTitle).toBe('Bash After');
      expect(result.toastVariant).toBe('info');
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

      (context.getToolConfigs as vi.Mock).mockReturnValue({});
      (context.getEventConfig as vi.Mock).mockReturnValue(undefined);

      const result = resolver.resolve('tool.execute.after', 'bash');

      expect(result.runScripts).toBe(true);
      expect(result.scripts).toContain('bash-after.sh');
    });

    it('should apply toolConfig override with block property', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getToolConfigs as vi.Mock).mockReturnValue({
        myTool: { block: true },
      });
      (context.getEventConfig as vi.Mock).mockReturnValue(undefined);

      const result = resolver.resolve('tool.execute.after', 'myTool');

      expect(result.block).toBe(true);
    });

    it('should apply full toolConfig overrides', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getToolConfigs as vi.Mock).mockReturnValue({
        myTool: {
          enabled: false,
          toast: false,
          debug: true,
          runScripts: true,
          block: true,
        },
      });
      (context.getEventConfig as vi.Mock).mockReturnValue(undefined);

      const result = resolver.resolve('tool.execute.after', 'myTool');

      expect(result.enabled).toBe(false);
      expect(result.toast).toBe(false); // explicitly disabled
      expect(result.debug).toBe(true);
      expect(result.runScripts).toBe(true);
      expect(result.block).toBe(true);
    });

    it('should resolve toast override from toolConfig', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getToolConfigs as vi.Mock).mockReturnValue({
        myTool: {
          toast: {
            title: 'Custom Title',
            variant: 'success' as const,
            duration: 10000,
          },
        },
      });
      (context.getEventConfig as vi.Mock).mockReturnValue(undefined);

      const result = resolver.resolve('tool.execute.after', 'myTool');

      expect(result.toastTitle).toBe('Custom Title');
      expect(result.toastVariant).toBe('success');
      expect(result.toastDuration).toBe(10000);
    });

    it('should handle empty toolConfig object', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getToolConfigs as vi.Mock).mockReturnValue({
        myTool: {},
      });
      (context.getEventConfig as vi.Mock).mockReturnValue(undefined);

      const result = resolver.resolve('tool.execute.after', 'myTool');

      expect(result.enabled).toBe(true);
    });

    it('should handle toolConfig with scripts override', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getToolConfigs as vi.Mock).mockReturnValue({
        myTool: {
          scripts: ['custom-script.sh'],
        },
      });
      (context.getEventConfig as vi.Mock).mockReturnValue(undefined);

      const result = resolver.resolve('tool.execute.after', 'myTool');

      expect(result.scripts).toContain('custom-script.sh');
    });
  });

  describe('resolveBase()', () => {
    it('should return base config with handler when eventConfig exists', () => {
      const context = createMockContext();
      context.handlers['my.event'] = {
        title: 'My Event',
        variant: 'warning' as const,
        duration: 3000,
        defaultScript: 'my-event.sh',
        buildMessage: () => 'My Event Message',
        allowedFields: ['field1', 'field2'],
      };
      const resolver = new ToolConfigResolverImpl(context);

      (context.getEventConfig as vi.Mock).mockReturnValue({
        toast: true,
        debug: true,
      });

      const result = resolver.resolveBase('my.event', { field1: 'value1' });

      expect(result.toast).toBe(true);
      expect(result.debug).toBe(true);
      expect(result.toastTitle).toBe('My Event');
      expect(result.toastVariant).toBe('warning');
      expect(result.allowedFields).toEqual(['field1', 'field2']);
    });

    it('should return base config with toast override from eventConfig', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getEventConfig as vi.Mock).mockReturnValue({
        toast: {
          title: 'Event Title',
          variant: 'error' as const,
          duration: 5000,
        },
      });

      const result = resolver.resolveBase('tool.execute.after', {});

      expect(result.toastTitle).toBe('Event Title');
      expect(result.toastVariant).toBe('error');
      expect(result.toastDuration).toBe(5000);
    });

    it('should return disabled config when eventConfig is false', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getEventConfig as vi.Mock).mockReturnValue(false);

      const result = resolver.resolveBase('tool.execute.after', {});

      expect(result.enabled).toBe(false);
      expect(result.toast).toBe(true);
      expect(result.debug).toBe(false);
    });

    it('should return default values when no handler exists', () => {
      const context = createMockContext({
        handlers: {},
      });
      const resolver = new ToolConfigResolverImpl(context);

      (context.getEventConfig as vi.Mock).mockReturnValue(undefined);

      const result = resolver.resolveBase('unknown.event', {});

      expect(result.toastTitle).toBe('');
      expect(result.toastVariant).toBe('info');
      expect(result.toastDuration).toBe(2000);
      expect(result.toastMessage).toBe('');
    });

    it('should use handler defaultScript in scripts array', () => {
      const context = createMockContext();
      const resolver = new ToolConfigResolverImpl(context);

      (context.getEventConfig as vi.Mock).mockReturnValue({
        runScripts: true,
      });

      const result = resolver.resolveBase('tool.execute.after', {});

      expect(result.scripts).toContain('tool-after.sh');
      expect(result.runScripts).toBe(true);
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

      (context.getToolConfigs as vi.Mock).mockReturnValue({
        myTool: { enabled: true },
      });
      (context.getEventConfig as vi.Mock).mockReturnValue(undefined);

      const result = resolver.resolve('tool.execute.after', 'myTool');
      expect(result.toastMessage).toBe('');
    });
  });
});
