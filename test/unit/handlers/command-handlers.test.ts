import { handlers } from '../../../.opencode/plugins/features/handlers';

describe('Command Handlers', () => {
  const commandHandlers = ['command.execute.before', 'command.executed'];

  it.each(commandHandlers)('should have handler for "%s"', (name) => {
    expect(handlers[name]).toBeDefined();
  });

  it.each(commandHandlers)(
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

  it.each(commandHandlers)(
    'handler "%s" buildMessage should return string',
    (name) => {
      const handler = handlers[name];
      const result = handler.buildMessage({ properties: {} });
      expect(typeof result).toBe('string');
    }
  );
});
