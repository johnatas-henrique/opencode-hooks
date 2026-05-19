import type { DebugRecorder } from '.opencode/plugins/types/audit';

export function getDebugRecorder(): DebugRecorder | null {
  const recorder = (globalThis as unknown as Record<string, unknown>)
    .__opencode_debug_recorder;
  return recorder as DebugRecorder | null;
}
