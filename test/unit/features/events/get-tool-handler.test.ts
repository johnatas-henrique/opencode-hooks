import { getToolHandler } from '.opencode/plugins/features/events/events';

describe('getToolHandler', () => {
  const customHandlers = {
    'tool.execute.before.git': { title: 'Before Git' },
    'tool.execute.after.git': { title: 'After Git' },
    'tool.execute.before.test': { title: 'Before Test' },
  };

  it('should return handler for .after tool event', () => {
    const handler = getToolHandler('git', 'tool.execute.after', customHandlers);
    expect(handler).toBeDefined();
    expect((handler as Record<string, unknown>).title).toBe('After Git');
  });

  it('should return handler for .before tool event', () => {
    const handler = getToolHandler(
      'git',
      'tool.execute.before',
      customHandlers
    );
    expect(handler).toBeDefined();
    expect((handler as Record<string, unknown>).title).toBe('Before Git');
  });

  it('should return undefined for nonexistent tool', () => {
    const handler = getToolHandler(
      'nonexistent',
      'tool.execute.before',
      customHandlers
    );
    expect(handler).toBeUndefined();
  });

  it('should return undefined for tool without matching pattern', () => {
    const handler = getToolHandler('git', 'tool.execute.other', customHandlers);
    expect(handler).toBeUndefined();
  });

  it('should return undefined when customHandlers is empty', () => {
    const handler = getToolHandler('git', 'tool.execute.before', {});
    expect(handler).toBeUndefined();
  });

  it('should use global handlers when customHandlers not provided', () => {
    const handler = getToolHandler('git-commit', 'tool.execute.before');
    expect(handler).toBeDefined();
  });
});
