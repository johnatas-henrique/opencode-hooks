import type { ToastOverride } from '.opencode/plugins/types/config';
import type { EventInput } from '.opencode/plugins/types/core';

export function buildToastMessage(
  toastCfg: ToastOverride | null,
  fallbackMessage: string,
  input: EventInput,
  output?: Record<string, unknown>
): string {
  if (toastCfg?.messageFn) {
    const fnMessage = toastCfg.messageFn(input, output);
    if (fnMessage !== undefined) {
      return fnMessage;
    }
  }
  return toastCfg?.message ?? fallbackMessage;
}
