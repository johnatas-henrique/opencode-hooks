import { handlers } from '../../../.opencode/plugins/features/handlers';

describe('TUI Handlers', () => {
  const tuiHandlers = [
    'tui.command.execute',
    'tui.prompt.append',
    'tui.toast.show',
  ];

  it.each(tuiHandlers)('should have handler for "%s"', (name) => {
    expect(handlers[name]).toBeDefined();
  });

  it.each(tuiHandlers)('handler "%s" should have required fields', (name) => {
    const handler = handlers[name];
    expect(handler.title).toBeDefined();
    expect(handler.variant).toBeDefined();
    expect(handler.duration).toBeDefined();
    expect(handler.defaultScript).toBeDefined();
    expect(handler.buildMessage).toBeDefined();
  });

  it.each(tuiHandlers)(
    'handler "%s" buildMessage should return string',
    (name) => {
      const handler = handlers[name];
      const result = handler.buildMessage({ properties: {} });
      expect(typeof result).toBe('string');
    }
  );
});
