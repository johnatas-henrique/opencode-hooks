import fs from 'fs';
import path from 'path';
import os from 'os';
import type {
  ScriptEntry,
  ClaudeHook,
  ClaudeHookGroup,
  ClaudeSettings,
} from '.opencode/plugins/types/config';

const CLAUDE_EVENT_MAP: Record<string, string> = {
  PreToolUse: 'tool.execute.before',
  PostToolUse: 'tool.execute.after',
  PostToolUseFailure: 'tool.execute.after',
  Stop: 'session.idle',
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

function mergeGlobalAndLocalScripts(
  global: Record<string, ClaudeHookGroup[]>,
  local: Record<string, ClaudeHookGroup[]>
): Record<string, ClaudeHookGroup[]> {
  const merged: Record<string, ClaudeHookGroup[]> = {};

  const allKeys = new Set<string>([
    ...Object.keys(global),
    ...Object.keys(local),
  ]);

  for (const key of allKeys) {
    const globalGroups = global[key] || [];
    const localGroups = local[key] || [];

    const groupMap = new Map<string, ClaudeHookGroup>();

    for (const group of globalGroups) {
      if (!group.matcher) continue;
      groupMap.set(group.matcher, {
        matcher: group.matcher,
        hooks: [...group.hooks],
      });
    }

    for (const localGroup of localGroups) {
      if (!localGroup.matcher) continue;
      const existing = groupMap.get(localGroup.matcher);

      if (existing) {
        const hookMap = new Map<string, ClaudeHook>();

        for (const hook of existing.hooks) {
          if (!hook.command) continue;
          hookMap.set(hook.command, hook);
        }

        for (const hook of localGroup.hooks) {
          if (!hook.command) continue;
          hookMap.set(hook.command, hook);
        }

        existing.hooks = Array.from(hookMap.values());
      } else {
        groupMap.set(localGroup.matcher, {
          matcher: localGroup.matcher,
          hooks: [...localGroup.hooks],
        });
      }
    }

    merged[key] = Array.from(groupMap.values());
  }

  return merged;
}

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
  if (trimmed.startsWith('node ')) trimmed = trimmed.slice(5).trim();
  if (trimmed.startsWith('bash ')) trimmed = trimmed.slice(5).trim();
  return trimmed;
}

export function mapClaudeHookToOpenCode(
  claudeEventName: string,
  hookGroup: ClaudeHookGroup,
  projectDir: string = ''
): { openCodeEvent: string; scripts: ScriptEntry[] } {
  const openCodeEvent = CLAUDE_EVENT_MAP[claudeEventName];

  if (!openCodeEvent) {
    const scripts: ScriptEntry[] = hookGroup.hooks.map((h) => ({
      source: 'claude' as const,
      path: extractCommandPath(h.command, projectDir),
      matcher: hookGroup.matcher,
      async: h.async,
      timeout: h.timeout,
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
    const globalSettings = JSON.parse(
      fs.readFileSync(globalPath, 'utf-8')
    ) as ClaudeSettings;
    if (globalSettings.hooks) globalHooks = globalSettings.hooks;
  }

  if (loadLocal && fs.existsSync(localPath)) {
    const localSettings = JSON.parse(
      fs.readFileSync(localPath, 'utf-8')
    ) as ClaudeSettings;
    if (localSettings.hooks) localHooks = localSettings.hooks;
  }

  if (fs.existsSync(localOverridePath)) {
    const overrideSettings = JSON.parse(
      fs.readFileSync(localOverridePath, 'utf-8')
    ) as ClaudeSettings;
    if (overrideSettings.hooks) localOverrideHooks = overrideSettings.hooks;
  }

  const mergedHooks = mergeGlobalAndLocalScripts(
    mergeGlobalAndLocalScripts(globalHooks, localHooks),
    localOverrideHooks
  );

  return mapAllHooksToOpenCode(mergedHooks, projectDir);
}

function mapAllHooksToOpenCode(
  hooks: Record<string, ClaudeHookGroup[]> | undefined,
  projectDir: string
): Record<string, ScriptEntry[]> {
  if (!hooks) return {};
  const result: Record<string, ScriptEntry[]> = {};

  for (const [claudeEventName, groups] of Object.entries(hooks)) {
    for (const group of groups) {
      const mapped = mapClaudeHookToOpenCode(
        claudeEventName,
        group,
        projectDir
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
