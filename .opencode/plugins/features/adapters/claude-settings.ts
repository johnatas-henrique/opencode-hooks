import fs from 'fs';
import path from 'path';
import os from 'os';
import type {
  ScriptEntry,
  ClaudeHookGroup,
  ClaudeSettings,
  ScriptOrigin,
} from '.opencode/plugins/types/config';

const claudeParseErrors: string[] = [];

export function getClaudeParseErrors(): string[] {
  return [...claudeParseErrors];
}

function parseJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<
      string,
      unknown
    >;
  } catch (e) {
    const msg = e instanceof SyntaxError ? e.message : String(e);
    claudeParseErrors.push(`Malformed JSON in ${filePath}: ${msg}`);
    return null;
  }
}

const CLAUDE_EVENT_MAP: Record<string, string> = {
  PreToolUse: 'tool.execute.before',
  PostToolUse: 'tool.execute.after',
  PostToolUseFailure: 'tool.execute.after',
  Stop: 'session.idle',
  SubagentStart: 'tool.execute.before.subagent',
  SubagentStop: 'tool.execute.after.subagent',
  SessionStart: 'session.created',
  SessionEnd: 'session.deleted',
  PreCompact: 'experimental.session.compacting',
  UserPromptSubmit: 'chat.message',
  PermissionRequest: 'permission.asked',
  Notification: '',
  ConfigChange: '',
  CwdChanged: '',
  FileChanged: 'file.watcher.updated',
};

function extractCommandPath(command: string, projectDir: string = ''): string {
  let trimmed = command.trim();
  if (projectDir) {
    trimmed = trimmed.replace(
      /\$CLAUDE_PROJECT_DIR|\$\{CLAUDE_PROJECT_DIR\}/g,
      projectDir
    );
  }
  if (trimmed.startsWith('~/')) {
    trimmed = path.join(os.homedir(), trimmed.slice(2));
  }
  return trimmed;
}

export function mapClaudeHookToOpenCode(
  claudeEventName: string,
  hookGroup: ClaudeHookGroup,
  projectDir: string = '',
  scriptType?: ScriptOrigin
): { openCodeEvent: string; scripts: ScriptEntry[] } {
  const openCodeEvent = CLAUDE_EVENT_MAP[claudeEventName];

  if (!openCodeEvent) {
    const scripts: ScriptEntry[] = hookGroup.hooks.map((h) => ({
      source: 'claude' as const,
      path: extractCommandPath(h.command, projectDir),
      matcher: hookGroup.matcher,
      async: h.async,
      timeout: h.timeout,
      scriptType,
    }));
    return {
      openCodeEvent: '',
      scripts,
    };
  }

  const scripts: ScriptEntry[] = hookGroup.hooks.map((h) => ({
    source: 'claude' as const,
    path: extractCommandPath(h.command, projectDir),
    matcher: hookGroup.matcher,
    async: h.async,
    timeout: h.timeout,
    scriptType,
  }));

  return { openCodeEvent, scripts };
}

export function loadClaudeSettings(
  projectDir: string,
  opts: { loadGlobal: boolean; loadLocal: boolean }
): Record<string, ScriptEntry[]> {
  const loadGlobal = opts.loadGlobal;
  const loadLocal = opts.loadLocal;

  const globalPath = path.join(os.homedir(), '.claude/settings.json');
  const localPath = path.join(projectDir, '.claude/settings.json');
  const localOverridePath = path.join(
    projectDir,
    '.claude/settings.local.json'
  );

  let globalHooks: Record<string, ClaudeHookGroup[]> = {};
  let localHooks: Record<string, ClaudeHookGroup[]> = {};
  let localOverrideHooks: Record<string, ClaudeHookGroup[]> = {};

  if (loadGlobal && fs.existsSync(globalPath)) {
    const globalSettings = parseJsonFile(globalPath) as ClaudeSettings | null;
    if (globalSettings?.hooks) globalHooks = globalSettings.hooks;
  }

  if (loadLocal && fs.existsSync(localPath)) {
    const localSettings = parseJsonFile(localPath) as ClaudeSettings | null;
    if (localSettings?.hooks) localHooks = localSettings.hooks;
  }

  if (fs.existsSync(localOverridePath)) {
    const overrideSettings = parseJsonFile(
      localOverridePath
    ) as ClaudeSettings | null;
    if (overrideSettings?.hooks) localOverrideHooks = overrideSettings.hooks;
  }

  const globalMapped = mapAllHooksToOpenCode(
    globalHooks,
    projectDir,
    'global-claude'
  );
  const localMapped = mapAllHooksToOpenCode(
    localHooks,
    projectDir,
    'local-claude'
  );
  const localOverrideMapped = mapAllHooksToOpenCode(
    localOverrideHooks,
    projectDir,
    'local-claude'
  );

  const allKeys = new Set([
    ...Object.keys(globalMapped),
    ...Object.keys(localMapped),
    ...Object.keys(localOverrideMapped),
  ]);

  const result: Record<string, ScriptEntry[]> = {};
  for (const key of allKeys) {
    result[key] = [
      ...(globalMapped[key] || []),
      ...(localMapped[key] || []),
      ...(localOverrideMapped[key] || []),
    ];
  }

  return result;
}

function mapAllHooksToOpenCode(
  hooks: Record<string, ClaudeHookGroup[]>,
  projectDir: string,
  scriptType: ScriptOrigin
): Record<string, ScriptEntry[]> {
  const result: Record<string, ScriptEntry[]> = {};

  for (const [claudeEventName, groups] of Object.entries(hooks)) {
    for (const group of groups) {
      const mapped = mapClaudeHookToOpenCode(
        claudeEventName,
        group,
        projectDir,
        scriptType
      );
      if (mapped.openCodeEvent && mapped.scripts.length > 0) {
        result[mapped.openCodeEvent] = [
          ...(result[mapped.openCodeEvent] || []),
          ...mapped.scripts,
        ];
      }
    }
  }

  return result;
}
