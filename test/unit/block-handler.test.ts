const mockToastAdd = vi.fn().mockResolvedValue(undefined);

vi.mock('../../.opencode/plugins/core/toast-queue', () => ({
  createToastQueue: vi.fn(),
  initGlobalToastQueue: vi.fn(),
  useGlobalToastQueue: () => ({
    add: mockToastAdd,
  }),
  resetGlobalToastQueue: vi.fn(),
  showToastStaggered: vi.fn(),
}));

vi.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../.opencode/plugins/core/constants', () => ({
  BLOCKED_EVENTS_LOG_FILE: 'blocked-events.log',
}));

import { vi } from 'vitest';
import type { Mock } from 'vitest';
import {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../.opencode/plugins/types/core';
import { executeBlocking } from '../../.opencode/plugins/features/block-system/block-handler';
import { saveToFile } from '../../.opencode/plugins/features/persistence/save-to-file';

const mockSaveToFile = saveToFile as Mock;

describe('block-handler', () => {
  const input: ToolExecuteBeforeInput = {
    tool: 'read',
    sessionID: '123',
    callID: 'call-1',
  };
  const output: ToolExecuteBeforeOutput = {
    args: { filePath: '/some/file.ts' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeBlocking', () => {
    it('throws when check.check returns true', () => {
      const block = [{ check: () => true, message: 'Custom blocked' }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).toThrow('Custom blocked');
    });

    it('logs raw data when data is not an object with eventType', () => {
      mockSaveToFile.mockClear();

      const block = [{ check: () => true, message: 'blocked' }];
      expect(() =>
        executeBlocking(
          block,
          input,
          output,
          [],
          'tool.execute.before',
          'test-log.log'
        )
      ).toThrow('blocked');

      const call = mockSaveToFile.mock.calls[0][0];
      expect(call.content).toBeDefined();
    });
  });
});
