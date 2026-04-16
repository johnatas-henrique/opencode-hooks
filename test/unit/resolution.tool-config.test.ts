import { ToolConfigResolverImpl } from '../../.opencode/plugins/features/events/resolvers/tool-config.resolver';
import type { ConfigResolverContext } from '../../.opencode/plugins/features/events/interfaces';

describe('ToolConfigResolverImpl', () => {
  const mockContext: ConfigResolverContext = {
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
        variant: 'info',
        duration: 2000,
        defaultScript: 'tool-after.sh',
        buildMessage: () => 'Tool After Message',
      },
    },
    getEventConfig: jest.fn(),
    getToolConfigs: jest.fn(),
  };

  const resolver = new ToolConfigResolverImpl(mockContext);

  it('should return empty string when handler.buildMessage throws', () => {
    const handler = {
      title: 'Error Tool',
      variant: 'info' as const,
      duration: 2000,
      defaultScript: 'error.sh',
      buildMessage: () => {
        throw new Error('Boom');
      },
    };

    // We need to inject this handler into the context
    mockContext.handlers['tool.execute.after'] = handler;

    (mockContext.getToolConfigs as jest.Mock).mockReturnValue({
      myTool: { enabled: true },
    });
    (mockContext.getEventConfig as jest.Mock).mockReturnValue(undefined);

    const result = resolver.resolve('tool.execute.after', 'myTool');
    expect(result.toastMessage).toBe('');
  });
});
