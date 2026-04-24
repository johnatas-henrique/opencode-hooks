// Use vi.hoisted to create mocks that persist correctly across tests
const { mockToastAdd, mockGetSecurityRecorder } = vi.hoisted(() => {
  const mockToastAdd = vi.fn().mockResolvedValue(undefined);
  const mockGetSecurityRecorder = vi.fn().mockReturnValue(null);
  return { mockToastAdd, mockGetSecurityRecorder };
});

vi.mock('../../.opencode/plugins/core/toast-queue', () => ({
  createToastQueue: vi.fn(),
  initGlobalToastQueue: vi.fn(),
  useGlobalToastQueue: () => ({
    add: mockToastAdd,
  }),
  resetGlobalToastQueue: vi.fn(),
  showToastStaggered: vi.fn(),
}));

vi.mock('../../.opencode/plugins/core/constants', () => ({
  BLOCKED_EVENTS_LOG_FILE: 'blocked-events.log',
}));

vi.mock('../../.opencode/plugins/features/audit/security-recorder', () => ({
  getSecurityRecorder: mockGetSecurityRecorder,
}));

import { vi } from 'vitest';
import {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../.opencode/plugins/types/core';
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
    vi.clearAllMocks();
    mockGetSecurityRecorder.mockReturnValue(null);
  });

  describe('executeBlocking', () => {
    it('throws when check.check returns true', () => {
      const mockRecorder = {
        logSecurity: vi.fn().mockResolvedValue(undefined),
      };
      mockGetSecurityRecorder.mockReturnValue(mockRecorder);
      const block = [{ check: () => true, message: 'Custom blocked' }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).toThrow('Custom blocked');
    });
  });

  describe('executeBlocking early return', () => {
    it('should return early when blockConfig is undefined', () => {
      executeBlocking(undefined, input, output, [], 'tool.execute.before');
      expect(mockToastAdd).not.toHaveBeenCalled();
    });

    it('should return early when blockConfig is empty array', () => {
      executeBlocking([], input, output, [], 'tool.execute.before');
      expect(mockToastAdd).not.toHaveBeenCalled();
    });

    describe('executeBlocking with missing securityRecorder', () => {
      it('should return early without throwing when securityRecorder is null', () => {
        const block = [{ check: () => true, message: 'blocked' }];
        // mockGetSecurityRecorder default is null from beforeEach
        expect(() =>
          executeBlocking(block, input, output, [], 'tool.execute.before')
        ).not.toThrow();
        expect(mockToastAdd).not.toHaveBeenCalled();
      });
    });
  });

  describe('defaultEffects.log null securityRecorder', () => {
    it('should call securityRecorder.logSecurity when securityRecorder is present', () => {
      const mockRecorder = {
        logSecurity: vi.fn().mockResolvedValue(undefined),
      };
      mockGetSecurityRecorder.mockReturnValue(mockRecorder);
      const block = [{ check: () => true, message: 'test' }];
      try {
        executeBlocking(block, input, output, [], 'tool.execute.before');
      } catch {
        // Expected
      }
      expect(mockRecorder.logSecurity).toHaveBeenCalled();
    });

    it('should use default message when block.message is undefined', () => {
      const mockRecorder = {
        logSecurity: vi.fn().mockResolvedValue(undefined),
      };
      mockGetSecurityRecorder.mockReturnValue(mockRecorder);
      const block = [{ check: () => true, message: 'Blocked' }];
      try {
        executeBlocking(block, input, output, [], 'tool.execute.before');
      } catch {
        // Expected
      }
      expect(mockRecorder.logSecurity).toHaveBeenCalledWith(
        expect.objectContaining({ rule: 'Blocked', reason: 'Blocked' })
      );
    });

    it('should use securityRecorder when logFilename is not blocked-events.log', () => {
      const mockRecorder = {
        logSecurity: vi.fn().mockResolvedValue(undefined),
      };
      mockGetSecurityRecorder.mockReturnValue(mockRecorder);
      const block = [{ check: () => true, message: 'blocked' }];
      try {
        executeBlocking(block, input, output, [], 'tool.execute.before');
      } catch {
        // Expected
      }
      expect(mockRecorder.logSecurity).toHaveBeenCalled();
    });

    it('should use default "Blocked" message when block.message is falsy (line 72-73)', () => {
      const mockRecorder = {
        logSecurity: vi.fn().mockResolvedValue(undefined),
      };
      mockGetSecurityRecorder.mockReturnValue(mockRecorder);
      const block = [{ check: () => true, message: '' }];
      try {
        executeBlocking(block, input, output, [], 'tool.execute.before');
      } catch {
        // Expected
      }
      expect(mockRecorder.logSecurity).toHaveBeenCalledWith(
        expect.objectContaining({ rule: 'Blocked', reason: 'Blocked' })
      );
    });
  });
});
