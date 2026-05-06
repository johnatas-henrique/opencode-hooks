import fs from 'fs';
import path from 'path';
import os from 'os';
import type {
  ScriptEntry,
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

function _deepMerge(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...a };
  for (const key of Object.keys(b)) {
    const valA = a[key];
    const valB = b[key];
    if (
      typeof valB === 'object' &&
      valB !== null &&
      !Array.isArray(valB) &&
      typeof valA === 'object' &&
      valA !== null &&
      !Array.isArray(valA)
    ) {
      result[key] = _deepMerge(
        valA as Record<string, unknown>,
        valB as Record<string, unknown>
      );
    } else {
      result[key] = valB;
    }
  }
  return result;
}

function mergeHooksStrategyA(
  global: Record<string, ClaudeHookGroup[]> | undefined,
  local: Record<string, ClaudeHookGroup[]> | undefined
): Record<string, ClaudeHookGroup[]> {
  const merged: Record<string, ClaudeHookGroup[]> = {};

  const allKeys = new Set<string>();
  if (global) {
    for (const key of Object.keys(global)) allKeys.add(key);
  }
  if (local) {
    for (const key of Object.keys(local)) allKeys.add(key);
  }

  for (const key of allKeys) {
    const g = global?.[key];
    const l = local?.[key];
    if (l && l.length > 0) {
      merged[key] = l;
    } else if (g && g.length > 0) {
      merged[key] = g;
    }
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
  if (trimmed.startsWith('node ')) trimmed = trimmed.slice(5).trim();
  if (trimmed.startsWith('bash ')) trimmed = trimmed.slice(5).trim();
  return trimmed;
}

export function mapClaudeHookToOpenCode(
  claudeEventName: string,
  hookGroup: ClaudeHookGroup,
  projectDir: string = ''
): { openCodeEvent: string; scripts: ScriptEntry[]; unsupported: string[] } {
  const openCodeEvent = CLAUDE_EVENT_MAP[claudeEventName];

  if (!openCodeEvent) {
    return {
      openCodeEvent: '',
      scripts: [],
      unsupported: [claudeEventName],
    };
  }

  const scripts: ScriptEntry[] = hookGroup.hooks.map((h) => ({
    source: 'claude' as const,
    path: extractCommandPath(h.command, projectDir),
    matcher: hookGroup.matcher,
    async: h.async,
    timeout: h.timeout,
  }));

  return { openCodeEvent, scripts, unsupported: [] };
}

export function loadClaudeSettings(
  projectDir: string,
  opts?: { loadGlobal?: boolean; loadLocal?: boolean }
): {
  global: Record<string, ScriptEntry[]>;
  local: Record<string, ScriptEntry[]>;
  all: Record<string, ScriptEntry[]>;
  unsupported: string[];
} {
  const loadGlobal = opts?.loadGlobal ?? true;
  const loadLocal = opts?.loadLocal ?? true;

  // Estratégia A: global > local
  // Hierarquia: global > local (priority 2 > priority 1)
  const globalPath = path.join(os.homedir(), '.claude/settings.json');
  const localPath = path.join(projectDir, '.claude/settings.json');
  const localOverridePath = path.join(
    projectDir,
    '.claude/settings.local.json'
  );

  let globalHooks: Record<string, ClaudeHookGroup[]> | undefined;
  let localHooks: Record<string, ClaudeHookGroup[]> | undefined;
  let localOverrideHooks: Record<string, ClaudeHookGroup[]> | undefined;

  if (loadGlobal && fs.existsSync(globalPath)) {
    const globalSettings = JSON.parse(
      fs.readFileSync(globalPath, 'utf-8')
    ) as ClaudeSettings;
    globalHooks = globalSettings.hooks;
  }

  if (loadLocal && fs.existsSync(localPath)) {
    const localSettings = JSON.parse(
      fs.readFileSync(localPath, 'utf-8')
    ) as ClaudeSettings;
    localHooks = localSettings.hooks;
  }

  if (fs.existsSync(localOverridePath)) {
    const overrideSettings = JSON.parse(
      fs.readFileSync(localOverridePath, 'utf-8')
    ) as ClaudeSettings;
    localOverrideHooks = overrideSettings.hooks;
  }

  // Mapear cada fonte separadamente
  const globalScripts = mapAllHooksToOpenCode(globalHooks, projectDir);
  const localScripts = mapAllHooksToOpenCode(localHooks, projectDir);

  // Merge estratégia A: localOverride > local > global
  const mergedHooks = mergeHooksStrategyA(
    mergeHooksStrategyA(globalHooks, localHooks),
    localOverrideHooks
  );
  const allScripts = mapAllHooksToOpenCode(mergedHooks, projectDir);

  const unsupported: string[] = [];
  for (const [claudeEventName, groups] of Object.entries(mergedHooks ?? {})) {
    for (const group of groups) {
      const mapped = mapClaudeHookToOpenCode(
        claudeEventName,
        group,
        projectDir
      );
      unsupported.push(...mapped.unsupported);
    }
  }

  return {
    global: globalScripts,
    local: localScripts,
    all: allScripts,
    unsupported,
  };
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
