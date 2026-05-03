import type { SecurityRecorder } from '.opencode/plugins/types/audit';

export function getSecurityRecorder(): SecurityRecorder | null {
  const recorder = (globalThis as unknown as Record<string, unknown>)
    .__opencode_security_recorder;
  return recorder as SecurityRecorder | null;
}
