import { DEFAULTS } from '.opencode/plugins/core/constants';
import { buildKeysMessage } from '.opencode/plugins/features/message-formatter/build-keys-message';
import type { EventHandler } from '.opencode/plugins/types/events';
import { createHandler } from '.opencode/plugins/features/handlers/create-handler';

interface AfterToolConfig {
  tool: string;
  title: string;
  defaultScript: string;
  allowedFields: string[];
  variant?: 'info' | 'success';
  duration?: number;
  defaultTemplate?: string;
}

const AFTER_TOOLS: AfterToolConfig[] = [
  {
    tool: 'bash',
    title: '====BASH AFTER====',
    defaultScript: 'tool-execute-after.bash.sh',
    allowedFields: ['tool', 'output.title', 'metadata.exit'],
  },
  {
    tool: 'codesearch',
    title: '====CODE SEARCH AFTER====',
    defaultScript: 'tool-execute-after.codesearch.sh',
    allowedFields: ['tool'],
  },
  {
    tool: 'edit',
    title: '====EDIT AFTER====',
    defaultScript: 'tool-execute-after.edit.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'filesystem_create_directory',
    title: '====FS MKDIR AFTER====',
    defaultScript: 'tool-execute-after.filesystem_create_directory.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'filesystem_get_file_info',
    title: '====FS STAT AFTER====',
    defaultScript: 'tool-execute-after.filesystem_get_file_info.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'filesystem_list_directory',
    title: '====FS LS AFTER====',
    defaultScript: 'tool-execute-after.filesystem_list_directory.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'filesystem_move_file',
    title: '====FS MV AFTER====',
    defaultScript: 'tool-execute-after.filesystem_move_file.sh',
    allowedFields: ['tool', 'args.source', 'args.destination'],
  },
  {
    tool: 'filesystem_read_file',
    title: '====FS READ AFTER====',
    defaultScript: 'tool-execute-after.filesystem_read_file.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'filesystem_search_files',
    title: '====FS FIND AFTER====',
    defaultScript: 'tool-execute-after.filesystem_search_files.sh',
    allowedFields: ['tool', 'args.pattern'],
  },
  {
    tool: 'filesystem_write_file',
    title: '====FS WRITE AFTER====',
    defaultScript: 'tool-execute-after.filesystem_write_file.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'gh_grep_searchGitHub',
    title: '====GH SEARCH AFTER====',
    defaultScript: 'tool-execute-after.github_search_code.sh',
    allowedFields: ['tool'],
  },
  {
    tool: 'git-commit',
    title: '====GIT COMMIT AFTER====',
    defaultScript: 'tool-execute-after.git-commit.sh',
    allowedFields: ['tool', 'output.title', 'metadata.exit'],
    variant: 'success',
    duration: DEFAULTS.toast.durations.TEN_SECONDS,
    defaultTemplate: '[{timestamp}] Git commit: {output.title}',
  },
  {
    tool: 'glob',
    title: '====GLOB AFTER====',
    defaultScript: 'tool-execute-after.glob.sh',
    allowedFields: ['tool', 'args.pattern'],
  },
  {
    tool: 'grep',
    title: '====GREP AFTER====',
    defaultScript: 'tool-execute-after.grep.sh',
    allowedFields: ['tool', 'args.pattern'],
  },
  {
    tool: 'list',
    title: '====LIST AFTER====',
    defaultScript: 'tool-execute-after.list.sh',
    allowedFields: ['tool'],
  },
  {
    tool: 'patch',
    title: '====PATCH AFTER====',
    defaultScript: 'tool-execute-after.patch.sh',
    allowedFields: ['tool', 'args.path'],
  },
  {
    tool: 'question',
    title: '====QUESTION AFTER====',
    defaultScript: 'tool-execute-after.question.sh',
    allowedFields: ['tool'],
  },
  {
    tool: 'read',
    title: '====READ AFTER====',
    defaultScript: 'tool-execute-after.read.sh',
    allowedFields: ['tool', 'args.filePath'],
  },
  {
    tool: 'skill',
    title: '====SKILL AFTER====',
    defaultScript: 'tool-execute-after.skill.sh',
    allowedFields: ['tool', 'output.title'],
  },
  {
    tool: 'task',
    title: '====TASK AFTER====',
    defaultScript: 'tool-execute-after.task.sh',
    allowedFields: ['tool'],
  },
  {
    tool: 'todoread',
    title: '====TODO READ AFTER====',
    defaultScript: 'tool-execute-after.todoread.sh',
    allowedFields: ['tool'],
  },
  {
    tool: 'todowrite',
    title: '====TODO WRITE AFTER====',
    defaultScript: 'tool-execute-after.todowrite.sh',
    allowedFields: ['tool'],
  },
  {
    tool: 'webfetch',
    title: '====WEB FETCH AFTER====',
    defaultScript: 'tool-execute-after.webfetch.sh',
    allowedFields: ['tool', 'args.url'],
  },
  {
    tool: 'websearch',
    title: '====WEB SEARCH AFTER====',
    defaultScript: 'tool-execute-after.websearch.sh',
    allowedFields: ['tool', 'args.query'],
  },
  {
    tool: 'write',
    title: '====WRITE AFTER====',
    defaultScript: 'tool-execute-after.write.sh',
    allowedFields: ['tool', 'args.filePath'],
  },
];

export const toolAfterHandlers: Record<string, EventHandler> = {};
for (const cfg of AFTER_TOOLS) {
  toolAfterHandlers[`tool.execute.after.${cfg.tool}`] = createHandler({
    title: cfg.title,
    variant: cfg.variant ?? 'info',
    duration: cfg.duration ?? DEFAULTS.toast.durations.FIVE_SECONDS,
    defaultScript: cfg.defaultScript,
    buildMessage: buildKeysMessage,
    allowedFields: cfg.allowedFields,
    ...(cfg.defaultTemplate ? { defaultTemplate: cfg.defaultTemplate } : {}),
  });
}
