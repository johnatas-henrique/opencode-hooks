import { handlers } from '../../.opencode/plugins/helpers/default-handlers';

describe('Tool-Specific Handlers Validation', () => {
  const toolHandlersBefore = Object.keys(handlers).filter((key) =>
    key.startsWith('tool.execute.before.')
  );

  const toolHandlersAfter = Object.keys(handlers).filter((key) =>
    key.startsWith('tool.execute.after.')
  );

  const toolHandlersFallback = Object.keys(handlers).filter((key) =>
    key.startsWith('tool:')
  );

  it('should have before handlers for main tools', () => {
    const mainToolsBefore = [
      'tool.execute.before.bash',
      'tool.execute.before.skill',
      'tool.execute.before.task',
      'tool.execute.before.read',
      'tool.execute.before.write',
    ];
    mainToolsBefore.forEach((tool) => {
      expect(toolHandlersBefore).toContain(tool);
    });
  });

  it('should have after handlers for main tools', () => {
    const mainToolsAfter = [
      'tool.execute.after.bash',
      'tool.execute.after.skill',
      'tool.execute.after.task',
      'tool.execute.after.read',
      'tool.execute.after.write',
    ];
    mainToolsAfter.forEach((tool) => {
      expect(toolHandlersAfter).toContain(tool);
    });
  });

  it('should NOT have fallback handlers (no tool:*)', () => {
    expect(toolHandlersFallback).toHaveLength(0);
  });

  it('each tool handler should have required fields with valid types', () => {
    const validVariants = ['success', 'warning', 'error', 'info'];
    const allToolHandlers = [...toolHandlersBefore, ...toolHandlersAfter];

    for (const handlerKey of allToolHandlers) {
      const handler = handlers[handlerKey];

      expect(handler).toHaveProperty('title');
      expect(handler).toHaveProperty('variant');
      expect(handler).toHaveProperty('duration');
      expect(handler).toHaveProperty('defaultScript');
      expect(handler).toHaveProperty('buildMessage');

      expect(typeof handler.title).toBe('string');
      expect(handler.title.length).toBeGreaterThan(0);

      expect(validVariants).toContain(handler.variant);

      expect(typeof handler.duration).toBe('number');
      expect(handler.duration).toBeGreaterThan(0);

      expect(typeof handler.defaultScript).toBe('string');
      expect(handler.defaultScript.length).toBeGreaterThan(0);

      expect(typeof handler.buildMessage).toBe('function');
    }
  });

  it('tool handler titles should follow consistent format (===TITLE===)', () => {
    const format = /^=+[A-Z0-9 -]+====$/;
    const allToolHandlers = [...toolHandlersBefore, ...toolHandlersAfter];

    for (const handlerKey of allToolHandlers) {
      const handler = handlers[handlerKey];
      expect(handler.title).toMatch(format);
    }
  });

  it('tool handler defaultScript names should follow naming convention', () => {
    const allToolHandlers = [...toolHandlersBefore, ...toolHandlersAfter];

    for (const handlerKey of allToolHandlers) {
      const handler = handlers[handlerKey];
      expect(handler.defaultScript).toMatch(
        /^tool-execute-(before|after)|after\.subagent/
      );
    }
  });
});
