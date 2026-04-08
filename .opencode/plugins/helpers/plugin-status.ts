import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { DEFAULT_SESSION_ID } from './constants';
import type { PluginStatusDisplayMode } from './config';

const LINE_REGEX = /^(INFO|WARN|ERROR|DEBUG)\s+\S+\s+\+\d+ms\s+(.+)$/;
const TAG_REGEX = /^(\w+)=(.+)$/;
const INTERNAL_PLUGIN_MARKER = 'internal plugin';
const LOADING_MARKER = 'loading';
const INCOMPATIBLE_MARKER = 'incompatible';

export interface PluginStatus {
  name: string;
  status: 'active' | 'failed' | 'incompatible';
  error?: string;
  source?: 'built-in' | 'user';
}

interface PluginEntry {
  level: string;
  message: string;
  name?: string;
  path?: string;
  pkg?: string;
  error?: string;
}

function getLogDirectory(): string {
  const xdgData = process.env.XDG_DATA_HOME;
  const dataDir = xdgData || join(homedir(), '.local', 'share');
  return join(dataDir, 'opencode', 'log');
}

export function getLatestLogFile(): string | null {
  const logDir = getLogDirectory();
  if (!existsSync(logDir)) return null;

  const files = readdirSync(logDir).filter((f) => f.endsWith('.log'));
  if (files.length === 0) return null;

  const sorted = files.sort((a, b) => {
    if (a === 'dev.log') return 1;
    if (b === 'dev.log') return -1;
    return b.localeCompare(a);
  });

  return join(logDir, sorted[0]);
}

function parseLogLine(line: string): PluginEntry | null {
  const match = line.match(LINE_REGEX);
  if (!match) return null;

  const [, level, rest] = match;
  const tags: Record<string, string> = {};
  let message = '';

  const parts = rest.split(/\s+/);
  let i = 0;
  while (i < parts.length) {
    const tagMatch = parts[i].match(TAG_REGEX);
    if (tagMatch) {
      tags[tagMatch[1]] = tagMatch[2];
      i++;
    } else {
      message = parts.slice(i).join(' ');
      break;
    }
  }

  if (tags.service !== 'plugin') return null;

  return {
    level,
    message,
    name: tags.name,
    path: tags.path,
    pkg: tags.pkg,
    error: tags.error,
  };
}

function extractPluginName(entry: PluginEntry): string {
  return entry.name || entry.path || entry.pkg || DEFAULT_SESSION_ID;
}

function isBuiltInPlugin(entry: PluginEntry): boolean {
  return !!entry.name && entry.message.includes(INTERNAL_PLUGIN_MARKER);
}

export function getPluginStatus(): PluginStatus[] {
  const logFile = getLatestLogFile();
  if (!logFile || !existsSync(logFile)) return [];

  let content: string;
  try {
    content = readFileSync(logFile, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.split('\n');
  const entries: PluginEntry[] = [];

  for (const line of lines) {
    const entry = parseLogLine(line);
    if (entry) entries.push(entry);
  }

  const pluginMap = new Map<string, PluginStatus>();

  for (const entry of entries) {
    const name = extractPluginName(entry);
    const isBuiltIn = isBuiltInPlugin(entry);
    const source: 'built-in' | 'user' = isBuiltIn ? 'built-in' : 'user';

    if (entry.level === 'INFO' && entry.message.includes(LOADING_MARKER)) {
      if (!pluginMap.has(name)) {
        pluginMap.set(name, { name, status: 'active', source });
      }
    } else if (entry.level === 'ERROR') {
      const errorMsg = entry.error || entry.message;
      pluginMap.set(name, { name, status: 'failed', error: errorMsg, source });
    } else if (
      entry.level === 'WARN' &&
      entry.message.includes(INCOMPATIBLE_MARKER)
    ) {
      pluginMap.set(name, {
        name,
        status: 'incompatible',
        error: entry.message,
        source,
      });
    }
  }

  return Array.from(pluginMap.values());
}

export function formatPluginStatus(
  statuses: PluginStatus[],
  displayMode: PluginStatusDisplayMode = 'user-only'
): string {
  if (statuses.length === 0) return 'No plugins detected in logs';

  const userStatuses = statuses.filter((s) => s.source === 'user');

  const active = statuses.filter((s) => s.status === 'active');
  const failed = statuses.filter((s) => s.status === 'failed');
  const incompatible = statuses.filter((s) => s.status === 'incompatible');

  const activeUser = active.filter((s) => s.source === 'user');
  const activeBuiltIn = active.filter((s) => s.source === 'built-in');

  const failedUser = failed.filter((f) => f.source === 'user');
  const incompatibleUser = incompatible.filter((i) => i.source === 'user');

  const lines: string[] = [];

  if (displayMode === 'user-only') {
    lines.push(
      `Plugins: ${userStatuses.length} active, ${failedUser.length} failed, ${incompatibleUser.length} incompatible`
    );

    if (activeUser.length > 0) {
      lines.push('');
      lines.push('Active:');
      for (const p of activeUser) {
        lines.push(`  ✓ ${p.name}`);
      }
    }

    if (failedUser.length > 0) {
      lines.push('');
      lines.push('Failed:');
      for (const p of failedUser) {
        lines.push(`  ✗ ${p.name}${p.error ? ` (${p.error})` : ''}`);
      }
    }

    if (incompatibleUser.length > 0) {
      lines.push('');
      lines.push('Incompatible:');
      for (const p of incompatibleUser) {
        lines.push(`  ⚠ ${p.name}`);
      }
    }
  } else if (displayMode === 'user-separated') {
    lines.push(
      `Plugins: ${active.length} active, ${failed.length} failed, ${incompatible.length} incompatible`
    );

    if (activeUser.length > 0) {
      lines.push('');
      lines.push('Active (user):');
      for (const p of activeUser) {
        lines.push(`  ✓ ${p.name}`);
      }
    }

    if (activeBuiltIn.length > 0) {
      lines.push('');
      lines.push('Active (built-in):');
      for (const p of activeBuiltIn) {
        lines.push(`  ✓ ${p.name}`);
      }
    }

    if (failed.length > 0) {
      lines.push('');
      lines.push('Failed:');
      for (const p of failed) {
        lines.push(`  ✗ ${p.name}${p.error ? ` (${p.error})` : ''}`);
      }
    }

    if (incompatible.length > 0) {
      lines.push('');
      lines.push('Incompatible:');
      for (const p of incompatible) {
        lines.push(`  ⚠ ${p.name}`);
      }
    }
  } else {
    lines.push(
      `Plugins: ${active.length} active, ${failed.length} failed, ${incompatible.length} incompatible`
    );

    const allActive = [...activeUser, ...activeBuiltIn];
    if (allActive.length > 0) {
      lines.push('');
      lines.push('Active:');
      for (const p of allActive) {
        const label = p.source === 'built-in' ? '(built-in)' : '(user)';
        lines.push(`  ✓ ${p.name} ${label}`);
      }
    }

    if (failed.length > 0) {
      lines.push('');
      lines.push('Failed:');
      for (const p of failed) {
        const label = p.source === 'built-in' ? '(built-in)' : '(user)';
        lines.push(`  ✗ ${p.name}${p.error ? ` (${p.error})` : ''} ${label}`);
      }
    }

    if (incompatible.length > 0) {
      lines.push('');
      lines.push('Incompatible:');
      for (const p of incompatible) {
        const label = p.source === 'built-in' ? '(built-in)' : '(user)';
        lines.push(`  ⚠ ${p.name} ${label}`);
      }
    }
  }

  return lines.join('\n');
}
