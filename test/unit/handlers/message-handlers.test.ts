import { handlers } from '../../../.opencode/plugins/features/handlers';

describe('Message Handlers', () => {
  const messageHandlers = [
    'message.part.removed',
    'message.part.updated',
    'message.part.delta',
    'message.removed',
    'message.updated',
  ];

  it.each(messageHandlers)('should have handler for "%s"', (name) => {
    expect(handlers[name]).toBeDefined();
  });

  it.each(messageHandlers)(
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

  it.each(messageHandlers)(
    'handler "%s" buildMessage should return string',
    (name) => {
      const handler = handlers[name];
      const result = handler.buildMessage({ properties: {} });
      expect(typeof result).toBe('string');
    }
  );
});
