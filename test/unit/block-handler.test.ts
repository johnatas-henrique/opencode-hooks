import { vi } from 'vitest';

// Import real modules
import * as securityRecorderModule from '../../.opencode/plugins/features/audit/security-recorder';
import * as toastQueueModule from '../../.opencode/plugins/core/toast-queue';
import type { ToastQueue } from '../../.opencode/plugins/types/toast';
import {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../.opencode/plugins/types/core';
import {
  executeBlocking,
  createDefaultNotifyEffect,
  createDefaultLogEffect,
} from '../../.opencode/plugins/features/block-system/block-handler';

// Set up spies
const mockGetSecurityRecorder = vi.spyOn(
  securityRecorderModule,
  'getSecurityRecorder'
);
const mockToastAdd = vi.fn().mockResolvedValue(undefined);
const mockToastQueue: Partial<ToastQueue> = {
  add: mockToastAdd,
  addMultiple: vi.fn(),
  clear: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined),
  pending: 0,
};
vi.spyOn(toastQueueModule, 'useGlobalToastQueue').mockReturnValue(
  mockToastQueue as ToastQueue
);

// Mock constants
vi.mock('../../.opencode/plugins/core/constants', () => ({
  BLOCKED_EVENTS_LOG_FILE: 'blocked-events.log',
}));

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
    mockGetSecurityRecorder.mockReturnValue(null);
  });

  describe('executeBlocking', () => {
    it('throws when check.check returns true', () => {
      const mockRec = { logSecurity: vi.fn().mockResolvedValue(undefined) };
      mockGetSecurityRecorder.mockReturnValue(mockRec);
      const block = [{ check: () => true, message: 'Custom blocked' }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).toThrow('Custom blocked');
    });

    it('handles rejected logSecurity gracefully', async () => {
      const mockRec = {
        logSecurity: vi.fn().mockRejectedValue(new Error('fail')),
      };
      mockGetSecurityRecorder.mockReturnValue(mockRec);
      const block = [{ check: () => false, message: 'Allowed' }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).not.toThrow();
      expect(mockRec.logSecurity).toHaveBeenCalled();
    });
  });

  describe('executeBlocking early return', () => {
    it('returns early when blockConfig is undefined', () => {
      executeBlocking(undefined, input, output, [], 'tool.execute.before');
      expect(mockToastAdd).not.toHaveBeenCalled();
    });

    it('returns early when blockConfig is empty array', () => {
      executeBlocking([], input, output, [], 'tool.execute.before');
      expect(mockToastAdd).not.toHaveBeenCalled();
    });

    it('returns early without throwing when securityRecorder is null', () => {
      const block = [{ check: () => true, message: 'blocked' }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).not.toThrow();
      expect(mockToastAdd).not.toHaveBeenCalled();
    });
  });

  describe('createDefaultNotifyEffect', () => {
    it('creates notify effect that adds toast', () => {
      const notify = createDefaultNotifyEffect();
      notify('Test Title', { message: 'Test message' });
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: 'Test Title',
        message: 'Test message',
        variant: 'error',
        duration: 10000,
      });
    });
  });

  describe('createDefaultLogEffect', () => {
    it('logs security when recorder is present', async () => {
      const mockRec = { logSecurity: vi.fn().mockResolvedValue(undefined) };
      mockGetSecurityRecorder.mockReturnValue(mockRec);

      const log = createDefaultLogEffect();
      await log({ rule: 'test-rule', reason: 'test-reason' });

      expect(mockRec.logSecurity).toHaveBeenCalledWith({
        rule: 'test-rule',
        reason: 'test-reason',
      });
    });

    it('does not log when recorder is null', async () => {
      mockGetSecurityRecorder.mockReturnValue(null);

      const log = createDefaultLogEffect();
      await log({ rule: 'test-rule' });

      expect(mockGetSecurityRecorder).toHaveBeenCalled();
    });
  });
});
