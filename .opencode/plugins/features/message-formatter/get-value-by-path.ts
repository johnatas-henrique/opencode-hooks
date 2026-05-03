export function getValueByPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce((o, k) => (o as Record<string, unknown>)?.[k], obj);
}
