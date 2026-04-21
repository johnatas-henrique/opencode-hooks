import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../.opencode/plugins/types/core';
import type {
  BlockCheck,
  ScriptResult,
} from '../../.opencode/plugins/types/config';
import { createBlockSystem } from '../../.opencode/plugins/features/block-system';

describe('block-system - pure evaluation', () => {
  const input: ToolExecuteBeforeInput = {
    tool: 'read',
    sessionID: '123',
    callID: 'call-1',
  };
  const output: ToolExecuteBeforeOutput = {
    args: { filePath: '/some/file.ts' },
  };

  const mockEffects = {
    notify: vi.fn(),
    log: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('evaluate (pure)', () => {
    it('returns null when predicates is undefined', () => {
      const system = createBlockSystem(mockEffects);
      const result = system.evaluate(
        undefined as unknown as BlockCheck[],
        input,
        output,
        []
      );
      expect(result).toBeNull();
    });

    it('receives scriptResults in check function', () => {
      const system = createBlockSystem(mockEffects);
      const checkFn = vi.fn().mockReturnValue(true);
      const predicates: BlockCheck[] = [
        { check: checkFn, message: 'Test blocked' },
      ];
      const scriptResults: ScriptResult[] = [
        { script: 'test.sh', exitCode: 1, output: 'error' },
      ];
      const result = system.evaluate(predicates, input, output, scriptResults);
      expect(checkFn).toHaveBeenCalledWith(input, output, scriptResults);
      expect(result?.blocked).toBe(true);
    });
  });

  describe('evaluateWithEffects (side effects)', () => {
    it('does not call effects when not blocked', () => {
      const system = createBlockSystem(mockEffects);
      const predicates: BlockCheck[] = [
        { check: () => false, message: 'Test block' },
      ];
      system.evaluateWithEffects(
        predicates,
        input,
        output,
        [],
        'tool.execute.before'
      );
      expect(mockEffects.notify).not.toHaveBeenCalled();
      expect(mockEffects.log).not.toHaveBeenCalled();
    });

    it('calls log effect when blocked', async () => {
      const system = createBlockSystem(mockEffects);
      const predicates: BlockCheck[] = [
        { check: () => true, message: 'test-rule' },
      ];
      try {
        await system.evaluateWithEffects(
          predicates,
          input,
          output,
          [],
          'tool.execute.before'
        );
      } catch (_e) {
        // Expected to throw
      }
      await Promise.resolve();
      expect(mockEffects.log).toHaveBeenCalled();
    });

    it('should use default message when predicate.message is falsy (line 55 false branch)', async () => {
      const system = createBlockSystem(mockEffects);
      const predicates: BlockCheck[] = [
        { check: () => true, message: '' } as BlockCheck,
      ];
      try {
        await system.evaluateWithEffects(
          predicates,
          input,
          output,
          [],
          'tool.execute.before'
        );
      } catch (_e) {
        // Expected to throw
      }
      await Promise.resolve();
      expect(mockEffects.notify).toHaveBeenCalled();
    });

    it('should return blocked with message when predicate blocks', () => {
      const system = createBlockSystem(mockEffects);
      const predicates: BlockCheck[] = [
        { check: () => true, message: 'Test blocked' },
      ];
      const result = system.evaluate(predicates, input, output, []);
      expect(result?.blocked).toBe(true);
      expect(result?.message).toBe('Test blocked');
    });
  });
});
