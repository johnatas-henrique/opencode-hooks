import { EventConfigResolverImpl } from '../../.opencode/plugins/features/events/resolvers/event-config.resolver';
import type { ConfigResolverContext } from '../../.opencode/plugins/features/events/interfaces';
import type { EventOverride } from '../../.opencode/plugins/types/config';

describe('EventConfigResolverImpl', () => {
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
      'test.event': {
        title: 'Test Event',
        variant: 'info',
        duration: 2000,
        defaultScript: 'test.sh',
        allowedFields: ['field1'],
        buildMessage: () => 'Test Message',
      },
    },
    getEventConfig: jest.fn(),
    getToolConfigs: jest.fn(),
  };

  const resolver = new EventConfigResolverImpl(mockContext);

  it('should return user configured allowed fields', () => {
    const userConfig: EventOverride = {
      allowedFields: ['customField'],
    };
    (mockContext.getEventConfig as jest.Mock).mockReturnValue(userConfig);

    const result = resolver.resolve('test.event');
    expect(result.allowedFields).toEqual(['customField']);
  });

  it('should return handler allowed fields if user config is missing them', () => {
    const userConfig: EventOverride = {
      enabled: true,
    };
    (mockContext.getEventConfig as jest.Mock).mockReturnValue(userConfig);

    const result = resolver.resolve('test.event');
    expect(result.allowedFields).toEqual(['field1']);
  });
});
