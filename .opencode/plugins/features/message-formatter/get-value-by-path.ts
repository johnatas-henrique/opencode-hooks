export function getValueByPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce((o, k) => (o as Record<string, unknown>)?.[k], obj);
}

export function setValueByPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split('.');
  const last = parts.pop();
  if (!last) return;

  let current: Record<string, unknown> = obj;
  for (const part of parts) {
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[last] = value;
}
