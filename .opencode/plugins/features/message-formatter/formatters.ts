import { DEFAULTS } from '.opencode/plugins/core/constants';

const SENSITIVE_PATTERNS: Array<[RegExp, string]> = [
  [/(api[_-]?key)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(token)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(secret)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(password)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(credential)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(bearer)\s+[\w-]+/gi, '$1'],
  [/(gh[pousr]_)[a-zA-Z0-9]{10,}/gi, '$1'],
];

export function maskSensitive(
  str: string,
  patterns: Array<[RegExp, string]> = SENSITIVE_PATTERNS
): string {
  let result = str;
  for (const [pattern, group] of patterns) {
    result = result.replace(pattern, `${group}: [REDACTED]`);
  }
  return result;
}

export function truncate(
  str: string,
  maxLength: number = DEFAULTS.core.maxToastLength
): string {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + '...';
  }
  return str;
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'unknown';
  }
  const str = JSON.stringify(value);
  return truncate(maskSensitive(str));
}

export function formatTime(): string {
  return new Date().toLocaleTimeString();
}
