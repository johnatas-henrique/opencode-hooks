const mockToastAdd = jest.fn().mockResolvedValue(undefined);

jest.mock('../../.opencode/plugins/core/toast-queue', () => ({
  createToastQueue: jest.fn(),
  initGlobalToastQueue: jest.fn(),
  useGlobalToastQueue: () => ({
    add: mockToastAdd,
  }),
  resetGlobalToastQueue: jest.fn(),
  showToastStaggered: jest.fn(),
}));

jest.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../.opencode/plugins/core/constants', () => ({
  BLOCKED_EVENTS_LOG_FILE: 'blocked-events.log',
}));

import {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../.opencode/plugins/types/opencode-hooks';
import type { ScriptResult } from '../../.opencode/plugins/core/config';
import { executeBlocking } from '../../.opencode/plugins/features/block-system/block-handler';

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
    jest.clearAllMocks();
  });

  describe('executeBlocking', () => {
    it('does not throw when block is undefined', () => {
      expect(() =>
        executeBlocking(undefined, input, output, [], 'tool.execute.before')
      ).not.toThrow();
    });

    it('does not throw when block is empty array', () => {
      expect(() =>
        executeBlocking([], input, output, [], 'tool.execute.before')
      ).not.toThrow();
    });

    it('throws when check.check returns true', () => {
      const block = [{ check: () => true, message: 'Custom blocked' }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).toThrow('Custom blocked');
    });

    it('does not throw when check.check returns false', () => {
      const block = [{ check: () => false }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).not.toThrow();
    });

    it('throws when any check in array returns true', () => {
      const block = [
        { check: () => false },
        { check: () => true, message: 'Second blocked' },
      ];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).toThrow('Second blocked');
    });

    it('does not throw when all checks return false', () => {
      const block = [{ check: () => false }, { check: () => false }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).not.toThrow();
    });

    it('blocks based on scriptResults', () => {
      const block = [
        {
          check: (
            _: ToolExecuteBeforeInput,
            __: ToolExecuteBeforeOutput,
            results: ScriptResult[]
          ) => results.some((r) => r.exitCode !== 0),
        },
      ];
      const scriptResults: ScriptResult[] = [
        { script: 'test.sh', exitCode: 1, output: 'error' },
      ];
      expect(() =>
        executeBlocking(
          block,
          input,
          output,
          scriptResults,
          'tool.execute.before'
        )
      ).toThrow();
    });

    it('allows when all scriptResults succeed', () => {
      const block = [
        {
          check: (
            _: ToolExecuteBeforeInput,
            __: ToolExecuteBeforeOutput,
            results: ScriptResult[]
          ) => results.some((r) => r.exitCode !== 0),
        },
      ];
      const scriptResults: ScriptResult[] = [
        { script: 'test.sh', exitCode: 0, output: 'ok' },
      ];
      expect(() =>
        executeBlocking(
          block,
          input,
          output,
          scriptResults,
          'tool.execute.before'
        )
      ).not.toThrow();
    });

    it('uses default message when check.message is not provided', () => {
      const block = [{ check: () => true }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).toThrow('Blocked: read execution');
    });
  });
});
