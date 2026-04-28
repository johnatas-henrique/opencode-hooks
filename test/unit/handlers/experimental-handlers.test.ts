import { handlers } from '../../../.opencode/plugins/features/handlers';

describe('Experimental Handlers', () => {
  const experimentalHandlers = [
    'experimental.chat.messages.transform',
    'experimental.chat.system.transform',
    'experimental.session.compacting',
    'experimental.text.complete',
  ];

  it.each(experimentalHandlers)('should have handler for "%s"', (name) => {
    expect(handlers[name]).toBeDefined();
  });

  it.each(experimentalHandlers)(
    'handler "%s" should have required fields',
    (name) => {
      const handler = handlers[name];
      expect(handler.title).toBeDefined();
      expect(handler.variant).toBeDefined();
      expect(handler.duration).toBeDefined();
      expect(handler.defaultScript).toBeDefined();
      expect(handler.buildMessage).toBeDefined();
    }
  );

  it.each(experimentalHandlers)(
    'handler "%s" buildMessage should return string',
    (name) => {
      const handler = handlers[name];
      const result = handler.buildMessage({ properties: {} });
      expect(typeof result).toBe('string');
    }
  );
});
