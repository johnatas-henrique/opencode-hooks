import { handlers } from '../../../.opencode/plugins/features/handlers';

describe('Shell Handlers', () => {
  it('should have handler for shell.env', () => {
    expect(handlers['shell.env']).toBeDefined();
  });

  it('shell.env should have required fields', () => {
    const handler = handlers['shell.env'];
    expect(handler.title).toBeDefined();
    expect(handler.variant).toBeDefined();
    expect(handler.duration).toBeDefined();
    expect(handler.defaultScript).toBeDefined();
    expect(handler.buildMessage).toBeDefined();
  });

  it('shell.env buildMessage should return string', () => {
    const handler = handlers['shell.env'];
    const result = handler.buildMessage({ properties: {} });
    expect(typeof result).toBe('string');
  });
});
