import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface PluginStatus {
  name: string;
  status: 'active' | 'failed' | 'incompatible';
  error?: string;
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

  const files = readdirSync(logDir).filter((f: string) => f.endsWith('.log'));
  if (files.length === 0) return null;

  const sorted = files.sort((a: string, b: string) => {
    if (a === 'dev.log') return 1;
    if (b === 'dev.log') return -1;
    return b.localeCompare(a);
  });

  return join(logDir, sorted[0]);
}

function parseLogLine(line: string): PluginEntry | null {
  const match = line.match(/^(INFO|WARN|ERROR|DEBUG)\s+\S+\s+\+\d+ms\s+(.+)$/);
  if (!match) return null;

  const [, level, rest] = match;
  const tags: Record<string, string> = {};
  let message = '';

  const parts = rest.split(/\s+/);
  let i = 0;
  while (i < parts.length) {
    const tagMatch = parts[i].match(/^(\w+)=(.+)$/);
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
  return entry.name || entry.path || entry.pkg || 'unknown';
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

    if (entry.level === 'INFO' && entry.message.includes('loading')) {
      if (!pluginMap.has(name)) {
        pluginMap.set(name, { name, status: 'active' });
      }
    } else if (entry.level === 'ERROR') {
      const errorMsg = entry.error || entry.message;
      pluginMap.set(name, { name, status: 'failed', error: errorMsg });
    } else if (
      entry.level === 'WARN' &&
      entry.message.includes('incompatible')
    ) {
      pluginMap.set(name, {
        name,
        status: 'incompatible',
        error: entry.message,
      });
    }
  }

  return Array.from(pluginMap.values());
}

export function formatPluginStatus(statuses: PluginStatus[]): string {
  if (statuses.length === 0) return 'No plugins detected in logs';

  const active = statuses.filter((s) => s.status === 'active');
  const failed = statuses.filter((s) => s.status === 'failed');
  const incompatible = statuses.filter((s) => s.status === 'incompatible');

  const lines: string[] = [];
  lines.push(
    `Plugins: ${active.length} active, ${failed.length} failed, ${incompatible.length} incompatible`
  );

  if (active.length > 0) {
    lines.push('');
    lines.push('Active:');
    for (const p of active) {
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

  return lines.join('\n');
}
