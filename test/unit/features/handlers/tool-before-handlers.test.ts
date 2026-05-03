import { describe, it, expect } from 'vitest';
import { toolBeforeHandlers } from '.opencode/plugins/features/handlers/tool-before-handlers';

describe('toolBeforeHandlers', () => {
  const expectedKeys = [
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
  ] as const;

  it('contains all expected keys', () => {
    for (const key of expectedKeys) {
      expect(toolBeforeHandlers).toHaveProperty(key);
    }
    expect(Object.keys(toolBeforeHandlers).length).toBe(expectedKeys.length);
  });

  it('all handlers have title "====TOOL EXECUTE BEFORE====', () => {
    for (const key of expectedKeys) {
      expect(toolBeforeHandlers[key].title).toBe('====TOOL EXECUTE BEFORE====');
    }
  });

  it('all handlers are info variant', () => {
    for (const key of expectedKeys) {
      expect(toolBeforeHandlers[key].variant).toBe('info');
    }
  });

  it('all handlers have FIVE_SECONDS duration', () => {
    for (const key of expectedKeys) {
      expect(toolBeforeHandlers[key].duration).toBe(5000);
    }
  });

  it('all handlers use buildKeysMessageSimple', () => {
    for (const key of expectedKeys) {
      expect(typeof toolBeforeHandlers[key].buildMessage).toBe('function');
    }
  });

  it('each handler has correct defaultScript', () => {
    const scriptMap: Record<string, string> = {
      'tool.execute.before.bash': 'tool-execute-before.bash.sh',
      'tool.execute.before.codesearch': 'tool-execute-before.codesearch.sh',
      'tool.execute.before.edit': 'tool-execute-before.edit.sh',
      'tool.execute.before.filesystem_create_directory':
        'tool-execute-before.filesystem_create_directory.sh',
      'tool.execute.before.filesystem_get_file_info':
        'tool-execute-before.filesystem_get_file_info.sh',
      'tool.execute.before.filesystem_list_directory':
        'tool-execute-before.filesystem_list_directory.sh',
      'tool.execute.before.filesystem_move_file':
        'tool-execute-before.filesystem_move_file.sh',
      'tool.execute.before.filesystem_read_file':
        'tool-execute-before.filesystem_read_file.sh',
      'tool.execute.before.filesystem_search_files':
        'tool-execute-before.filesystem_search_files.sh',
      'tool.execute.before.filesystem_write_file':
        'tool-execute-before.filesystem_write_file.sh',
      'tool.execute.before.gh_grep_searchGitHub':
        'tool-execute-before.github_search_code.sh',
      'tool.execute.before.git-commit': 'tool-execute-before.git-commit.sh',
      'tool.execute.before.glob': 'tool-execute-before.glob.sh',
      'tool.execute.before.grep': 'tool-execute-before.grep.sh',
      'tool.execute.before.list': 'tool-execute-before.list.sh',
      'tool.execute.before.patch': 'tool-execute-before.patch.sh',
      'tool.execute.before.question': 'tool-execute-before.question.sh',
      'tool.execute.before.read': 'tool-execute-before.read.sh',
      'tool.execute.before.skill': 'tool-execute-before.skill.sh',
      'tool.execute.before.task': 'tool-execute-before.task.sh',
      'tool.execute.before.todoread': 'tool-execute-before.todoread.sh',
      'tool.execute.before.todowrite': 'tool-execute-before.todowrite.sh',
      'tool.execute.before.webfetch': 'tool-execute-before.webfetch.sh',
      'tool.execute.before.websearch': 'tool-execute-before.websearch.sh',
      'tool.execute.before.write': 'tool-execute-before.write.sh',
    };
    for (const [key, expectedScript] of Object.entries(scriptMap)) {
      expect(toolBeforeHandlers[key].defaultScript).toBe(expectedScript);
    }
  });

  it('handlers with tool+args have correct allowedFields', () => {
    expect(
      toolBeforeHandlers['tool.execute.before.bash'].allowedFields
    ).toEqual(['tool', 'args.command']);
    expect(
      toolBeforeHandlers['tool.execute.before.codesearch'].allowedFields
    ).toEqual(['tool', 'args.query']);
    expect(
      toolBeforeHandlers['tool.execute.before.edit'].allowedFields
    ).toEqual(['tool', 'args.path']);
    expect(
      toolBeforeHandlers['tool.execute.before.filesystem_read_file']
        .allowedFields
    ).toEqual(['tool', 'args.path']);
    expect(
      toolBeforeHandlers['tool.execute.before.filesystem_write_file']
        .allowedFields
    ).toEqual(['tool', 'args.path']);
    expect(
      toolBeforeHandlers['tool.execute.before.git-commit'].allowedFields
    ).toEqual(['tool', 'args.message']);
    expect(
      toolBeforeHandlers['tool.execute.before.glob'].allowedFields
    ).toEqual(['tool', 'args.pattern']);
    expect(
      toolBeforeHandlers['tool.execute.before.grep'].allowedFields
    ).toEqual(['tool', 'args.pattern']);
    expect(
      toolBeforeHandlers['tool.execute.before.read'].allowedFields
    ).toEqual(['tool', 'args.filePath']);
    expect(
      toolBeforeHandlers['tool.execute.before.skill'].allowedFields
    ).toEqual(['tool', 'args.name']);
    expect(
      toolBeforeHandlers['tool.execute.before.webfetch'].allowedFields
    ).toEqual(['tool', 'args.url']);
    expect(
      toolBeforeHandlers['tool.execute.before.websearch'].allowedFields
    ).toEqual(['tool', 'args.query']);
    expect(
      toolBeforeHandlers['tool.execute.before.write'].allowedFields
    ).toEqual(['tool', 'args.filePath']);
  });

  it('handlers with tool-only allowedFields', () => {
    const toolOnly = [
      'tool.execute.before.list',
      'tool.execute.before.task',
      'tool.execute.before.todoread',
      'tool.execute.before.todowrite',
    ] as const;
    for (const key of toolOnly) {
      expect(toolBeforeHandlers[key].allowedFields).toEqual(['tool']);
    }
  });
});
