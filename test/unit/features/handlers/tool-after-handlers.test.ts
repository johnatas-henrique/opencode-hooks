import { describe, it, expect } from 'vitest';
import { toolAfterHandlers } from '.opencode/plugins/features/handlers/tool-after-handlers';

describe('toolAfterHandlers', () => {
  const expectedKeys = [
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
  ] as const;

  it('contains all expected keys', () => {
    for (const key of expectedKeys) {
      expect(toolAfterHandlers).toHaveProperty(key);
    }
    expect(Object.keys(toolAfterHandlers).length).toBe(expectedKeys.length);
  });

  const expectedTitles: Record<string, string> = {
    'tool.execute.after.bash': '====BASH AFTER====',
    'tool.execute.after.codesearch': '====CODE SEARCH AFTER====',
    'tool.execute.after.edit': '====EDIT AFTER====',
    'tool.execute.after.filesystem_create_directory': '====FS MKDIR AFTER====',
    'tool.execute.after.filesystem_get_file_info': '====FS STAT AFTER====',
    'tool.execute.after.filesystem_list_directory': '====FS LS AFTER====',
    'tool.execute.after.filesystem_move_file': '====FS MV AFTER====',
    'tool.execute.after.filesystem_read_file': '====FS READ AFTER====',
    'tool.execute.after.filesystem_search_files': '====FS FIND AFTER====',
    'tool.execute.after.filesystem_write_file': '====FS WRITE AFTER====',
    'tool.execute.after.gh_grep_searchGitHub': '====GH SEARCH AFTER====',
    'tool.execute.after.git-commit': '====GIT COMMIT AFTER====',
    'tool.execute.after.glob': '====GLOB AFTER====',
    'tool.execute.after.grep': '====GREP AFTER====',
    'tool.execute.after.list': '====LIST AFTER====',
    'tool.execute.after.patch': '====PATCH AFTER====',
    'tool.execute.after.question': '====QUESTION AFTER====',
    'tool.execute.after.read': '====READ AFTER====',
    'tool.execute.after.skill': '====SKILL AFTER====',
    'tool.execute.after.task': '====TASK AFTER====',
    'tool.execute.after.todoread': '====TODO READ AFTER====',
    'tool.execute.after.todowrite': '====TODO WRITE AFTER====',
    'tool.execute.after.webfetch': '====WEB FETCH AFTER====',
    'tool.execute.after.websearch': '====WEB SEARCH AFTER====',
    'tool.execute.after.write': '====WRITE AFTER====',
  };

  it.each(expectedKeys)(
    'handler %s has correct title, variant, duration, and buildMessage',
    (key) => {
      const handler = toolAfterHandlers[key];
      expect(handler.title).toBe(expectedTitles[key]);
      if (key === 'tool.execute.after.git-commit') {
        expect(handler.variant).toBe('success');
        expect(handler.duration).toBe(10000);
      } else {
        expect(handler.variant).toBe('info');
        expect(handler.duration).toBe(5000);
      }
      expect(typeof handler.buildMessage).toBe('function');
    }
  );

  it('bash and git-commit and skill use buildKeysMessage', () => {
    const expectedScripts: Record<string, string> = {
      'tool.execute.after.bash': 'tool-execute-after.bash.sh',
      'tool.execute.after.codesearch': 'tool-execute-after.codesearch.sh',
      'tool.execute.after.edit': 'tool-execute-after.edit.sh',
      'tool.execute.after.filesystem_create_directory':
        'tool-execute-after.filesystem_create_directory.sh',
      'tool.execute.after.filesystem_get_file_info':
        'tool-execute-after.filesystem_get_file_info.sh',
      'tool.execute.after.filesystem_list_directory':
        'tool-execute-after.filesystem_list_directory.sh',
      'tool.execute.after.filesystem_move_file':
        'tool-execute-after.filesystem_move_file.sh',
      'tool.execute.after.filesystem_read_file':
        'tool-execute-after.filesystem_read_file.sh',
      'tool.execute.after.filesystem_search_files':
        'tool-execute-after.filesystem_search_files.sh',
      'tool.execute.after.filesystem_write_file':
        'tool-execute-after.filesystem_write_file.sh',
      'tool.execute.after.gh_grep_searchGitHub':
        'tool-execute-after.github_search_code.sh',
      'tool.execute.after.git-commit': 'tool-execute-after.git-commit.sh',
      'tool.execute.after.glob': 'tool-execute-after.glob.sh',
      'tool.execute.after.grep': 'tool-execute-after.grep.sh',
      'tool.execute.after.list': 'tool-execute-after.list.sh',
      'tool.execute.after.patch': 'tool-execute-after.patch.sh',
      'tool.execute.after.question': 'tool-execute-after.question.sh',
      'tool.execute.after.read': 'tool-execute-after.read.sh',
      'tool.execute.after.skill': 'tool-execute-after.skill.sh',
      'tool.execute.after.task': 'tool-execute-after.task.sh',
      'tool.execute.after.todoread': 'tool-execute-after.todoread.sh',
      'tool.execute.after.todowrite': 'tool-execute-after.todowrite.sh',
      'tool.execute.after.webfetch': 'tool-execute-after.webfetch.sh',
      'tool.execute.after.websearch': 'tool-execute-after.websearch.sh',
      'tool.execute.after.write': 'tool-execute-after.write.sh',
    };
    for (const [key, expectedScript] of Object.entries(expectedScripts)) {
      expect(toolAfterHandlers[key].defaultScript).toBe(expectedScript);
    }
  });

  it('git-commit has defaultTemplate', () => {
    const h = toolAfterHandlers['tool.execute.after.git-commit'];
    expect(h.defaultTemplate).toBe('[{timestamp}] Git commit: {output.title}');
  });

  it('bash and git-commit have allowedFields with output/metadata', () => {
    expect(toolAfterHandlers['tool.execute.after.bash'].allowedFields).toEqual([
      'tool',
      'output.title',
      'metadata.exit',
    ]);
    expect(
      toolAfterHandlers['tool.execute.after.git-commit'].allowedFields
    ).toEqual(['tool', 'output.title', 'metadata.exit']);
  });

  it('skill has tool+output.title allowedFields', () => {
    expect(toolAfterHandlers['tool.execute.after.skill'].allowedFields).toEqual(
      ['tool', 'output.title']
    );
  });

  it('handlers with tool+args have correct allowedFields', () => {
    expect(toolAfterHandlers['tool.execute.after.edit'].allowedFields).toEqual([
      'tool',
      'args.path',
    ]);
    expect(
      toolAfterHandlers['tool.execute.after.filesystem_read_file'].allowedFields
    ).toEqual(['tool', 'args.path']);
    expect(
      toolAfterHandlers['tool.execute.after.filesystem_write_file']
        .allowedFields
    ).toEqual(['tool', 'args.path']);
    expect(
      toolAfterHandlers['tool.execute.after.filesystem_move_file'].allowedFields
    ).toEqual(['tool', 'args.source', 'args.destination']);
    expect(toolAfterHandlers['tool.execute.after.glob'].allowedFields).toEqual([
      'tool',
      'args.pattern',
    ]);
    expect(toolAfterHandlers['tool.execute.after.grep'].allowedFields).toEqual([
      'tool',
      'args.pattern',
    ]);
    expect(toolAfterHandlers['tool.execute.after.read'].allowedFields).toEqual([
      'tool',
      'args.filePath',
    ]);
    expect(
      toolAfterHandlers['tool.execute.after.webfetch'].allowedFields
    ).toEqual(['tool', 'args.url']);
    expect(
      toolAfterHandlers['tool.execute.after.websearch'].allowedFields
    ).toEqual(['tool', 'args.query']);
    expect(toolAfterHandlers['tool.execute.after.write'].allowedFields).toEqual(
      ['tool', 'args.filePath']
    );
    expect(toolAfterHandlers['tool.execute.after.patch'].allowedFields).toEqual(
      ['tool', 'args.path']
    );
  });

  it('handlers with tool-only allowedFields', () => {
    const toolOnly = [
      'tool.execute.after.codesearch',
      'tool.execute.after.gh_grep_searchGitHub',
      'tool.execute.after.list',
      'tool.execute.after.question',
      'tool.execute.after.task',
      'tool.execute.after.todoread',
      'tool.execute.after.todowrite',
    ] as const;
    for (const key of toolOnly) {
      expect(toolAfterHandlers[key].allowedFields).toEqual(['tool']);
    }
  });
});
