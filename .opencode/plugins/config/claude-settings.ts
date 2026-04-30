import fs from 'fs';
import path from 'path';
import os from 'os';
import type { ScriptEntry } from '../types/config';

export interface ClaudeHookGroup {
  hooks: ClaudeHook[];
  matcher?: string;
}

export interface ClaudeHook {
  command: string;
  async?: boolean;
  timeout?: number;
}

interface ClaudeSettings {
  hooks?: Record<string, ClaudeHookGroup[]>;
  disableAllHooks?: boolean;
}

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

function deepMerge(
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
      result[key] = deepMerge(
        valA as Record<string, unknown>,
        valB as Record<string, unknown>
      );
    } else {
      result[key] = valB;
    }
  }
  return result;
}

function extractCommandPath(command: string): string {
  const trimmed = command.trim();
  if (trimmed.startsWith('node ')) return trimmed.slice(5).trim();
  if (trimmed.startsWith('bash ')) return trimmed.slice(5).trim();
  return trimmed;
}

export function mapClaudeHookToOpenCode(
  claudeEventName: string,
  hookGroup: ClaudeHookGroup
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
    path: extractCommandPath(h.command),
    matcher: hookGroup.matcher,
    async: h.async,
    timeout: h.timeout,
  }));

  return { openCodeEvent, scripts, unsupported: [] };
}

export function loadClaudeSettings(projectDir: string): {
  hooks: Record<string, ScriptEntry[]>;
  unsupported: string[];
} {
  const hierarchy = [
    path.join(os.homedir(), '.claude/settings.json'),
    path.join(projectDir, '.claude/settings.json'),
    path.join(projectDir, '.claude/settings.local.json'),
  ];

  let merged: Record<string, unknown> = {};
  for (const file of hierarchy) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      const settings = JSON.parse(content) as Record<string, unknown>;
      merged = deepMerge(merged, settings);
    }
  }

  const settings = merged as ClaudeSettings;
  if (!settings.hooks || settings.disableAllHooks) {
    return { hooks: {}, unsupported: [] };
  }

  const result: Record<string, ScriptEntry[]> = {};
  const allUnsupported: string[] = [];

  for (const [claudeEventName, groups] of Object.entries(settings.hooks)) {
    for (const group of groups) {
      const mapped = mapClaudeHookToOpenCode(claudeEventName, group);
      allUnsupported.push(...mapped.unsupported);
      if (mapped.openCodeEvent) {
        if (!result[mapped.openCodeEvent]) {
          result[mapped.openCodeEvent] = [];
        }
        result[mapped.openCodeEvent].push(...mapped.scripts);
      }
    }
  }

  return { hooks: result, unsupported: allUnsupported };
}
