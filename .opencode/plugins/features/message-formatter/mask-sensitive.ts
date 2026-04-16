export const SENSITIVE_PATTERNS: Array<[RegExp, string]> = [
  [/(api[_-]?key)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(token)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(secret)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(password)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(credential)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  [/(bearer)\s+[\w-]+/gi, '$1'],
  [/(gh[pousr]_[a-zA-Z0-9]{36,})/gi, '$1'],
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
