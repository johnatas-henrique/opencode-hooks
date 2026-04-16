jest.mock('../../.opencode/plugins/features/messages/default-handlers', () => ({
  handlers: {
    'tool.execute.before.git': { title: 'Before Git' },
    'tool.execute.after.git': { title: 'After Git' },
    'tool.execute.before.test': { title: 'Before Test' },
  },
}));

import { getToolHandler } from '../../.opencode/plugins/features/events/events';

describe('getToolHandler', () => {
  it('should return handler for .before tool event', () => {
    const handler = getToolHandler('git', 'tool.execute.before');
    expect(handler).toBeDefined();
    expect(handler?.title).toBe('Before Git');
  });

  it('should return handler for .after tool event', () => {
    const handler = getToolHandler('git', 'tool.execute.after');
    expect(handler).toBeDefined();
    expect(handler?.title).toBe('After Git');
  });

  it('should return undefined for nonexistent tool', () => {
    const handler = getToolHandler('nonexistent', 'tool.execute.before');
    expect(handler).toBeUndefined();
  });

  it('should return undefined for tool without event type', () => {
    const handler = getToolHandler('git', 'invalid.type');
    expect(handler).toBeUndefined();
  });

  it('should return undefined when toolEventType is empty', () => {
    const handler = getToolHandler('git', '');
    expect(handler).toBeUndefined();
  });

  it('should return undefined for tool without matching pattern', () => {
    const handler = getToolHandler('git', 'tool.execute.other');
    expect(handler).toBeUndefined();
  });
});
