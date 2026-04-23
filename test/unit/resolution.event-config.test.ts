import { EventConfigResolverImpl } from '../../.opencode/plugins/features/events/resolvers/event-config.resolver';
import type { ConfigResolverContext } from '../../.opencode/plugins/types/events';
import type { EventOverride } from '../../.opencode/plugins/types/config';
import type { Mock } from 'vitest';

describe('EventConfigResolverImpl', () => {
  const mockContext: ConfigResolverContext = {
    enabled: true,
    default: {
      enabled: true,
      toast: true,
      debug: false,
      runScripts: false,
      logToAudit: true,
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
    getEventConfig: vi.fn(),
    getToolConfigs: vi.fn(),
  };

  const resolver = new EventConfigResolverImpl(mockContext);

  it('should return user configured allowed fields', () => {
    const userConfig: EventOverride = {
      allowedFields: ['customField'],
    };
    (mockContext.getEventConfig as Mock).mockReturnValue(userConfig);

    const result = resolver.resolve('test.event');
    expect(result.allowedFields).toEqual(['customField']);
  });
});
