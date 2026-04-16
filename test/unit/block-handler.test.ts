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
} from '../../.opencode/plugins/types/core';
import type { ScriptResult } from '../../.opencode/plugins/types/config';
import { executeBlocking } from '../../.opencode/plugins/features/block-system/block-handler';
import { saveToFile } from '../../.opencode/plugins/features/persistence/save-to-file';

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

    it('uses custom logFilename for logging', () => {
      const block = [{ check: () => true, message: 'blocked' }];
      expect(() =>
        executeBlocking(
          block,
          input,
          output,
          [],
          'tool.execute.before',
          'custom-blocked.log'
        )
      ).toThrow('blocked');
      expect(saveToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'custom-blocked.log',
        })
      );
    });

    it('logs to custom file when logFilename differs from default', () => {
      const saveToFile =
        require('../../.opencode/plugins/features/persistence/save-to-file').saveToFile;
      saveToFile.mockClear();

      const block = [{ check: () => true, message: 'blocked' }];
      expect(() =>
        executeBlocking(
          block,
          input,
          output,
          [],
          'tool.execute.before',
          'another-custom.log'
        )
      ).toThrow('blocked');

      expect(saveToFile).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'another-custom.log',
          content: expect.stringContaining('EVENT_BLOCKED'),
        })
      );
    });

    it('logs event data when blocked with custom logFilename', () => {
      const saveToFile =
        require('../../.opencode/plugins/features/persistence/save-to-file').saveToFile;
      saveToFile.mockClear();

      const block = [{ check: () => true, message: 'blocked by test' }];
      expect(() =>
        executeBlocking(
          block,
          input,
          output,
          [],
          'tool.execute.before',
          'test-log.log'
        )
      ).toThrow('blocked by test');

      const call = saveToFile.mock.calls[0][0];
      const loggedData = JSON.parse(call.content);
      expect(loggedData.type).toBe('EVENT_BLOCKED');
      expect(loggedData.data.eventType).toBe('tool.execute.before');
    });

    it('logs raw data when data is not an object with eventType', () => {
      const saveToFile =
        require('../../.opencode/plugins/features/persistence/save-to-file').saveToFile;
      saveToFile.mockClear();

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

      const call = saveToFile.mock.calls[0][0];
      expect(call.content).toBeDefined();
    });
  });
});
