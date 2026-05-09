import { DEFAULTS } from '.opencode/plugins/core/constants';
import { buildKeysMessage } from '.opencode/plugins/features/message-formatter/build-keys-message';
import type { EventHandler } from '.opencode/plugins/types/events';
import { createHandler } from '.opencode/plugins/features/handlers/create-handler';

interface BeforeToolConfig {
  tool: string;
  title: string;
  defaultScript: string;
  allowedFields: string[];
}

const BEFORE_TOOLS: BeforeToolConfig[] = [
  {
    tool: 'bash',
    title: '====BASH BEFORE====',
    defaultScript: 'tool-execute-before.bash.sh',
    allowedFields: ['tool', 'args.command'],
  },
  {
    tool: 'codesearch',
    title: '====CODE SEARCH BEFORE====',
    defaultScript: 'tool-execute-before.codesearch.sh',
    allowedFields: ['tool', 'args.query'],
  },
  {
    tool: 'edit',
    title: '====EDIT BEFORE====',
    defaultScript: 'tool-execute-before.edit.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'filesystem_create_directory',
    title: '====FS MKDIR BEFORE====',
    defaultScript: 'tool-execute-before.filesystem_create_directory.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'filesystem_get_file_info',
    title: '====FS STAT BEFORE====',
    defaultScript: 'tool-execute-before.filesystem_get_file_info.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'filesystem_list_directory',
    title: '====FS LS BEFORE====',
    defaultScript: 'tool-execute-before.filesystem_list_directory.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'filesystem_move_file',
    title: '====FS MV BEFORE====',
    defaultScript: 'tool-execute-before.filesystem_move_file.sh',
    allowedFields: ['tool', 'args.source', 'args.destination'],
  },
  {
    tool: 'filesystem_read_file',
    title: '====FS READ BEFORE====',
    defaultScript: 'tool-execute-before.filesystem_read_file.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'filesystem_search_files',
    title: '====FS FIND BEFORE====',
    defaultScript: 'tool-execute-before.filesystem_search_files.sh',
    allowedFields: ['tool', 'args.pattern'],
  },
  {
    tool: 'filesystem_write_file',
    title: '====FS WRITE BEFORE====',
    defaultScript: 'tool-execute-before.filesystem_write_file.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'gh_grep_searchGitHub',
    title: '====GH SEARCH BEFORE====',
    defaultScript: 'tool-execute-before.github_search_code.sh',
    allowedFields: ['tool', 'args.query'],
  },
  {
    tool: 'git-commit',
    title: '====GIT COMMIT BEFORE====',
    defaultScript: 'tool-execute-before.git-commit.sh',
    allowedFields: ['tool', 'args.message'],
  },
  {
    tool: 'glob',
    title: '====GLOB BEFORE====',
    defaultScript: 'tool-execute-before.glob.sh',
    allowedFields: ['tool', 'args.pattern'],
  },
  {
    tool: 'grep',
    title: '====GREP BEFORE====',
    defaultScript: 'tool-execute-before.grep.sh',
    allowedFields: ['tool', 'args.pattern'],
  },
  {
    tool: 'list',
    title: '====LIST BEFORE====',
    defaultScript: 'tool-execute-before.list.sh',
    allowedFields: ['tool'],
  },
  {
    tool: 'patch',
    title: '====PATCH BEFORE====',
    defaultScript: 'tool-execute-before.patch.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'question',
    title: '====QUESTION BEFORE====',
    defaultScript: 'tool-execute-before.question.sh',
    allowedFields: ['tool', 'args.question'],
  },
  {
    tool: 'read',
    title: '====READ BEFORE====',
    defaultScript: 'tool-execute-before.read.sh',
    allowedFields: ['tool', 'args.filePath'],
  },
  {
    tool: 'skill',
    title: '====SKILL BEFORE====',
    defaultScript: 'tool-execute-before.skill.sh',
    allowedFields: ['tool', 'args.name'],
  },
  {
    tool: 'task',
    title: '====TASK BEFORE====',
    defaultScript: 'tool-execute-before.task.sh',
    allowedFields: ['tool'],
  },
  {
    tool: 'todoread',
    title: '====TODO READ BEFORE====',
    defaultScript: 'tool-execute-before.todoread.sh',
    allowedFields: ['tool'],
  },
  {
    tool: 'todowrite',
    title: '====TODO WRITE BEFORE====',
    defaultScript: 'tool-execute-before.todowrite.sh',
    allowedFields: ['tool'],
  },
  {
    tool: 'webfetch',
    title: '====WEB FETCH BEFORE====',
    defaultScript: 'tool-execute-before.webfetch.sh',
    allowedFields: ['tool', 'args.url'],
  },
  {
    tool: 'websearch',
    title: '====WEB SEARCH BEFORE====',
    defaultScript: 'tool-execute-before.websearch.sh',
    allowedFields: ['tool', 'args.query'],
  },
  {
    tool: 'write',
    title: '====WRITE BEFORE====',
    defaultScript: 'tool-execute-before.write.sh',
    allowedFields: ['tool', 'args.filePath'],
  },
];

export const toolBeforeHandlers: Record<string, EventHandler> = {};
for (const cfg of BEFORE_TOOLS) {
  toolBeforeHandlers[`tool.execute.before.${cfg.tool}`] = createHandler({
    title: cfg.title,
    variant: 'info',
    duration: DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: cfg.defaultScript,
    buildMessage: buildKeysMessage,
    allowedFields: cfg.allowedFields,
  });
}
