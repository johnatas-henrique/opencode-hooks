import { handlers } from '../../../.opencode/plugins/features/handlers';

describe('Todo Handlers', () => {
  it('should have handler for todo.updated', () => {
    expect(handlers['todo.updated']).toBeDefined();
  });

  it('todo.updated should have required fields', () => {
    const handler = handlers['todo.updated'];
    expect(handler.title).toBeDefined();
    expect(handler.variant).toBeDefined();
    expect(handler.duration).toBeDefined();
    expect(handler.defaultScript).toBeDefined();
    expect(handler.buildMessage).toBeDefined();
  });

  it('todo.updated buildMessage should return string', () => {
    const handler = handlers['todo.updated'];
    const result = handler.buildMessage({ properties: {} });
    expect(typeof result).toBe('string');
  });
});
