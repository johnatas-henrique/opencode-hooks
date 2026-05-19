import fs from 'fs';
import path from 'path';
import os from 'os';
import type { UserEventsConfig } from '.opencode/plugins/types/config';
import type { AuditConfig } from '.opencode/plugins/types/audit';
import { defaultUserConfig } from '.opencode/plugins/config/defaults';

export function stripJsonComments(json: string): string {
  let inString = false;
  let result = '';
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    const prev = i > 0 ? json[i - 1] : '';
    if (ch === '"' && prev !== '\\') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (!inString && ch === '/' && json[i + 1] === '/') {
      while (i < json.length && json[i] !== '\n') i++;
      continue;
    }
    if (!inString && ch === '/' && json[i + 1] === '*') {
      i += 2;
      while (i < json.length && !(json[i] === '*' && json[i + 1] === '/')) i++;
      i++;
      continue;
    }
    result += ch;
  }
  return result;
}

export function readJsonc(filePath: string): Partial<UserEventsConfig> | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(stripJsonComments(raw));
  } catch {
    return null;
  }
}

function mergeField<T>(base: T, next: T | undefined): T {
  return next ?? base;
}

function mergeObject<T extends object>(base: T, next: T | undefined): T {
  return next ? { ...base, ...next } : base;
}

function mergeAudit(
  base: AuditConfig,
  next: Partial<AuditConfig> | undefined
): AuditConfig {
  return next
    ? { ...base, ...next, files: { ...base.files, ...next.files } }
    : base;
}

type ToolsConfig = UserEventsConfig['tools'];

const TOOL_SECTIONS: (keyof ToolsConfig)[] = [
  'tool.execute.after',
  'tool.execute.after.subagent',
  'tool.execute.before',
  'tool.execute.before.subagent',
];

function mergeTools(
  base: ToolsConfig,
  next: Partial<ToolsConfig> | undefined
): ToolsConfig {
  if (!next) return base;
  const result = { ...base };
  for (const section of TOOL_SECTIONS) {
    const override = next[section];
    if (override) {
      result[section] = {
        ...result[section],
        ...override,
      };
    }
  }
  return result;
}

export function deepMerge(
  base: UserEventsConfig,
  override: Partial<UserEventsConfig>
): UserEventsConfig {
  return {
    ...base,
    enabled: mergeField(base.enabled, override.enabled),
    logDisabledEvents: mergeField(
      base.logDisabledEvents,
      override.logDisabledEvents
    ),
    showPluginStatus: mergeField(
      base.showPluginStatus,
      override.showPluginStatus
    ),
    pluginStatusDisplayMode: mergeField(
      base.pluginStatusDisplayMode,
      override.pluginStatusDisplayMode
    ),
    toastQueue: mergeObject(base.toastQueue, override.toastQueue),
    loadClaudeHookSettings: mergeObject(
      base.loadClaudeHookSettings,
      override.loadClaudeHookSettings
    ),
    scriptToasts: mergeObject(base.scriptToasts, override.scriptToasts),
    default: mergeObject(base.default, override.default),
    audit: mergeAudit(base.audit, override.audit),
    events: mergeObject(base.events, override.events),
    tools: mergeTools(base.tools, override.tools),
  };
}

function getConfigPaths(): { projectPath: string; globalPath: string } {
  return {
    projectPath: path.join(process.cwd(), '.opencode', 'opencode-hooks.jsonc'),
    globalPath: path.join(
      os.homedir(),
      '.config',
      'opencode',
      'opencode-hooks.jsonc'
    ),
  };
}

function reportParseError(projectPath: string, globalPath: string): void {
  const projectExists = fs.existsSync(projectPath);
  const globalExists = fs.existsSync(globalPath);
  if (projectExists || globalExists) {
    console.error(
      `[opencode-hooks] JSONC found but failed to parse:` +
        (projectExists ? ` project(${projectPath})` : '') +
        (globalExists ? ` global(${globalPath})` : '')
    );
  }
}

export function loadUserConfig(
  defaults: UserEventsConfig = defaultUserConfig
): UserEventsConfig {
  const { projectPath, globalPath } = getConfigPaths();
  const globalConfig = readJsonc(globalPath);
  const projectConfig = readJsonc(projectPath);

  if (!globalConfig && !projectConfig) {
    reportParseError(projectPath, globalPath);
    return defaults;
  }

  let config = defaults;
  if (globalConfig) config = deepMerge(config, globalConfig);
  if (projectConfig) config = deepMerge(config, projectConfig);
  return config;
}
