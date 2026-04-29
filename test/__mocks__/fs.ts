import { vi } from 'vitest';

const originalModule = await vi.importActual(
  '../../.opencode/plugins/features/persistence/save-to-file'
);

vi.spyOn(
  originalModule as typeof import('../../.opencode/plugins/features/persistence/save-to-file'),
  'saveToFile'
).mockResolvedValue(undefined);

export const saveToFile = vi.fn().mockResolvedValue(undefined);
