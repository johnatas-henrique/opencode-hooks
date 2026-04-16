import { maskSensitive } from './mask-sensitive';
import { truncate } from './truncate';

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'unknown';
  }
  const str = JSON.stringify(value);
  return truncate(maskSensitive(str));
}
