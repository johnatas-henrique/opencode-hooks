import { handlers } from '../../.opencode/plugins/helpers/default-handlers';

describe('Tool-Specific Handlers Validation', () => {
  const toolHandlers = Object.keys(handlers).filter((key) =>
    key.startsWith('tool:')
  );

  it('should have handlers for all 28 expected tools', () => {
    expect(toolHandlers.length).toBe(28);

    const expectedTools = [
      'tool:read',
      'tool:write',
      'tool:edit',
      'tool:bash',
      'tool:task',
      'tool:skill',
      'tool:chat',
      'tool:glob',
      'tool:grep',
      'tool:list',
      'tool:patch',
      'tool:webfetch',
      'tool:websearch',
      'tool:codesearch',
      'tool:todowrite',
      'tool:todoread',
      'tool:question',
      'tool:git.commit',
      'tool:git.push',
      'tool:git.pull',
      'tool:filesystem_read_file',
      'tool:filesystem_write_file',
      'tool:filesystem_list_directory',
      'tool:filesystem_search_files',
      'tool:filesystem_create_directory',
      'tool:filesystem_move_file',
      'tool:filesystem_get_file_info',
      'tool:gh_grep_searchGitHub',
    ];

    expectedTools.forEach((tool) => {
      expect(toolHandlers).toContain(tool);
    });
  });

  it('each tool handler should have required fields with valid types', () => {
    const validVariants = ['success', 'warning', 'error', 'info'];

    for (const handlerKey of toolHandlers) {
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
    const format = /^=+[A-Z0-9 ]+=+$/;

    for (const handlerKey of toolHandlers) {
      const handler = handlers[handlerKey];
      expect(handler.title).toMatch(format);
    }
  });

  it('tool handler defaultScript names should start with tool-execute-', () => {
    for (const handlerKey of toolHandlers) {
      const handler = handlers[handlerKey];
      expect(handler.defaultScript).toMatch(/^tool-execute-/);
    }
  });
});
