import { handlers } from '../../../.opencode/plugins/features/handlers';

describe('Tool-Specific Handlers', () => {
  const toolBeforeHandlers = [
    'tool.execute.before.bash',
    'tool.execute.before.codesearch',
    'tool.execute.before.edit',
    'tool.execute.before.filesystem_create_directory',
    'tool.execute.before.filesystem_get_file_info',
    'tool.execute.before.filesystem_list_directory',
    'tool.execute.before.filesystem_move_file',
    'tool.execute.before.filesystem_read_file',
    'tool.execute.before.filesystem_search_files',
    'tool.execute.before.filesystem_write_file',
    'tool.execute.before.gh_grep_searchGitHub',
    'tool.execute.before.git-commit',
    'tool.execute.before.glob',
    'tool.execute.before.grep',
    'tool.execute.before.list',
    'tool.execute.before.patch',
    'tool.execute.before.question',
    'tool.execute.before.read',
    'tool.execute.before.skill',
    'tool.execute.before.task',
    'tool.execute.before.todoread',
    'tool.execute.before.todowrite',
    'tool.execute.before.webfetch',
    'tool.execute.before.websearch',
    'tool.execute.before.write',
  ];

  const toolAfterHandlers = [
    'tool.execute.after.bash',
    'tool.execute.after.codesearch',
    'tool.execute.after.edit',
    'tool.execute.after.filesystem_create_directory',
    'tool.execute.after.filesystem_get_file_info',
    'tool.execute.after.filesystem_list_directory',
    'tool.execute.after.filesystem_move_file',
    'tool.execute.after.filesystem_read_file',
    'tool.execute.after.filesystem_search_files',
    'tool.execute.after.filesystem_write_file',
    'tool.execute.after.gh_grep_searchGitHub',
    'tool.execute.after.git-commit',
    'tool.execute.after.glob',
    'tool.execute.after.grep',
    'tool.execute.after.list',
    'tool.execute.after.patch',
    'tool.execute.after.question',
    'tool.execute.after.read',
    'tool.execute.after.skill',
    'tool.execute.after.task',
    'tool.execute.after.todoread',
    'tool.execute.after.todowrite',
    'tool.execute.after.webfetch',
    'tool.execute.after.websearch',
    'tool.execute.after.write',
  ];

  describe('tool.execute.before.*', () => {
    it.each(toolBeforeHandlers)('should have handler for "%s"', (name) => {
      expect(handlers[name]).toBeDefined();
    });

    it.each(toolBeforeHandlers)(
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

    it.each(toolBeforeHandlers)(
      'handler "%s" buildMessage should return string',
      (name) => {
        const handler = handlers[name];
        const result = handler.buildMessage({ properties: {} });
        expect(typeof result).toBe('string');
      }
    );
  });

  describe('tool.execute.after.*', () => {
    it.each(toolAfterHandlers)('should have handler for "%s"', (name) => {
      expect(handlers[name]).toBeDefined();
    });

    it.each(toolAfterHandlers)(
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

    it.each(toolAfterHandlers)(
      'handler "%s" buildMessage should return string',
      (name) => {
        const handler = handlers[name];
        const result = handler.buildMessage({ properties: {} });
        expect(typeof result).toBe('string');
      }
    );
  });
});
