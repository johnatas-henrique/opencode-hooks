import { EventConfigResolverImpl } from '../../.opencode/plugins/features/events/resolvers/event-config.resolver';
import type { ConfigResolverContext } from '../../.opencode/plugins/types/events';
import type { EventOverride } from '../../.opencode/plugins/types/config';
import type { Mock } from 'vitest';
import * as pluginIntegration from '../../.opencode/plugins/features/audit/plugin-integration';

describe('EventConfigResolverImpl', () => {
  const createMockContext = (
    handlers: ConfigResolverContext['handlers'] = {}
  ): ConfigResolverContext => ({
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
    handlers,
    getEventConfig: vi.fn(),
    getToolConfigs: vi.fn(),
  });

  const createMockRecorder = () => ({
    logToolExecuteBefore: vi.fn().mockResolvedValue(undefined),
    logToolExecuteAfter: vi.fn().mockResolvedValue(undefined),
    logSessionEvent: vi.fn().mockResolvedValue(undefined),
    logEvent: vi.fn().mockResolvedValue(undefined),
  });

  it('should return user configured allowed fields', () => {
    const mockContext = createMockContext({
      'test.event': {
        title: 'Test Event',
        variant: 'info',
        duration: 2000,
        defaultScript: 'test.sh',
        allowedFields: ['field1'],
        buildMessage: () => 'Test Message',
      },
    });
    const resolver = new EventConfigResolverImpl(mockContext);

    const userConfig: EventOverride = {
      allowedFields: ['customField'],
    };
    (mockContext.getEventConfig as Mock).mockReturnValue(userConfig);

    const result = resolver.resolve('test.event');
    expect(result.allowedFields).toEqual(['customField']);
  });

  describe('unknown event handling', () => {
    it('logs unknown event when no handler and no user config', () => {
      const mockContext = createMockContext({});
      const resolver = new EventConfigResolverImpl(mockContext);
      (mockContext.getEventConfig as Mock).mockReturnValue(undefined);

      const mockRecorder = createMockRecorder();
      vi.spyOn(pluginIntegration, 'getEventRecorder').mockReturnValue(
        mockRecorder
      );

      resolver.resolve('unknown.event');

      expect(mockRecorder.logEvent).toHaveBeenCalledWith(
        'unknown',
        expect.anything()
      );
    });

    it('handles rejected logEvent gracefully', async () => {
      const mockContext = createMockContext({});
      const resolver = new EventConfigResolverImpl(mockContext);
      (mockContext.getEventConfig as Mock).mockReturnValue(undefined);

      const mockRecorder = createMockRecorder();
      mockRecorder.logEvent = vi.fn().mockRejectedValue(new Error('fail'));
      vi.spyOn(pluginIntegration, 'getEventRecorder').mockReturnValue(
        mockRecorder
      );

      // Should not throw even though logEvent rejects
      resolver.resolve('unknown.event');
      expect(mockRecorder.logEvent).toHaveBeenCalled();
    });
  });
});
