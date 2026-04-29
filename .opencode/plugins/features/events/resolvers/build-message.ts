import type { ToastOverride } from '../../../types/config';

export function buildToastMessage(
  toastCfg: ToastOverride | null,
  fallbackMessage: string,
  input: Record<string, unknown>,
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
