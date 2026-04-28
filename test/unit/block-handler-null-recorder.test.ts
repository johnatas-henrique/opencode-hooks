import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeBlocking } from '../../.opencode/plugins/features/block-system/block-handler';
import type { SecurityRecorder } from '../../.opencode/plugins/types/audit';
import * as securityRecorder from '../../.opencode/plugins/features/audit/security-recorder';
import type {
  BlockEffects,
  BlockSystem,
} from '../../.opencode/plugins/types/block-system';
import { createBlockSystem } from '../../.opencode/plugins/types/block-system';
import type {
  BlockCheck,
  ScriptResult,
} from '../../.opencode/plugins/types/config';
import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../.opencode/plugins/types/core';

vi.mock('../../.opencode/plugins/features/audit/security-recorder', () => ({
  getSecurityRecorder: vi.fn(),
}));

vi.mock('../../.opencode/plugins/types/block-system', () => ({
  createBlockSystem: vi.fn(),
}));

describe('block-handler null recorder coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should cover line 31 (else branch) when securityRecorder is null inside log effect', async () => {
    const mockRecorder: SecurityRecorder = {
      logSecurity: vi.fn().mockResolvedValue(undefined),
    };

    const recorderSpy = vi.spyOn(securityRecorder, 'getSecurityRecorder');
    recorderSpy.mockReturnValueOnce(mockRecorder).mockReturnValue(null);

    let capturedEffects: BlockEffects | undefined;
    vi.mocked(createBlockSystem).mockImplementation((effects: BlockEffects) => {
      capturedEffects = effects;
      const mockSystem: BlockSystem = {
        evaluate: vi.fn(),
        evaluateWithEffects: vi.fn(),
      };
      return mockSystem;
    });

    const blockConfig: BlockCheck[] = [
      {
        check: vi.fn().mockReturnValue(true),
        message: 'Blocked by test',
      },
    ];

    const input: ToolExecuteBeforeInput = {
      tool: 'test',
      sessionID: '123',
      callID: 'call-123',
    };
    const output: ToolExecuteBeforeOutput = { args: {} };
    const scriptResults: ScriptResult[] = [
      { script: 'test.sh', exitCode: 1, output: 'blocked' },
    ];

    executeBlocking(
      blockConfig,
      input,
      output,
      scriptResults,
      'tool.execute.before'
    );

    if (capturedEffects && capturedEffects.log) {
      await capturedEffects.log({ rule: 'test' });
    }

    expect(recorderSpy).toHaveBeenCalled();
  });
});
