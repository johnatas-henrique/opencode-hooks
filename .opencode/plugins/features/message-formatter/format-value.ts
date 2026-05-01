import { maskSensitive } from '.opencode/plugins/features/message-formatter/mask-sensitive';
import { truncate } from '.opencode/plugins/features/message-formatter/truncate';

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'unknown';
  }
  const str = JSON.stringify(value);
  return truncate(maskSensitive(str));
}
