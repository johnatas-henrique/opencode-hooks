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
    notify: jest.fn(),
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluate (pure)', () => {
    it('returns null when predicates is empty', () => {
      const system = createBlockSystem(mockEffects);
      const result = system.evaluate([], input, output, []);
      expect(result).toBeNull();
    });

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

    it('returns null when no check blocks', () => {
      const system = createBlockSystem(mockEffects);
      const predicates: BlockCheck[] = [{ check: () => false }];
      const result = system.evaluate(predicates, input, output, []);
      expect(result).toBeNull();
    });

    it('returns blocked result when check blocks', () => {
      const system = createBlockSystem(mockEffects);
      const predicates: BlockCheck[] = [
        { check: () => true, message: 'Blocked!' },
      ];
      const result = system.evaluate(predicates, input, output, []);
      expect(result?.blocked).toBe(true);
      expect(result?.message).toBe('Blocked!');
    });

    it('uses default message when not provided', () => {
      const system = createBlockSystem(mockEffects);
      const predicates: BlockCheck[] = [{ check: () => true }];
      const result = system.evaluate(predicates, input, output, []);
      expect(result?.blocked).toBe(true);
      expect(result?.message).toBe('Blocked: read execution');
    });

    it('checks predicates in order and returns first blocking', () => {
      const system = createBlockSystem(mockEffects);
      const predicates: BlockCheck[] = [
        { check: () => false },
        { check: () => true, message: 'Second blocked' },
        { check: () => true, message: 'Third blocked' },
      ];
      const result = system.evaluate(predicates, input, output, []);
      expect(result?.blocked).toBe(true);
      expect(result?.message).toBe('Second blocked');
    });

    it('receives scriptResults in check function', () => {
      const system = createBlockSystem(mockEffects);
      const checkFn = jest.fn().mockReturnValue(true);
      const predicates: BlockCheck[] = [{ check: checkFn }];
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
      const predicates: BlockCheck[] = [{ check: () => false }];
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

    it('calls notify and log when blocked', () => {
      const system = createBlockSystem(mockEffects);
      const predicates: BlockCheck[] = [
        { check: () => true, message: 'Blocked!' },
      ];
      expect(() => {
        system.evaluateWithEffects(
          predicates,
          input,
          output,
          [],
          'tool.execute.before'
        );
      }).toThrow('Blocked!');
      expect(mockEffects.notify).toHaveBeenCalledWith(
        'READ BEFORE - EVENT BLOCKED',
        expect.objectContaining({ message: 'Blocked!' })
      );
      expect(mockEffects.log).toHaveBeenCalled();
    });

    it('throws error when blocked', () => {
      const system = createBlockSystem(mockEffects);
      const predicates: BlockCheck[] = [
        { check: () => true, message: 'Test block' },
      ];
      expect(() => {
        system.evaluateWithEffects(
          predicates,
          input,
          output,
          [],
          'tool.execute.before'
        );
      }).toThrow('Test block');
    });
  });
});
