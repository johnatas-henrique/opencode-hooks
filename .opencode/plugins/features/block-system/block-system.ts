import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../types/core';
import type { BlockCheck, ScriptResult } from '../../types/config';

export interface BlockResult {
  blocked: boolean;
  predicate: BlockCheck;
  message?: string;
}

export interface BlockEffects {
  notify: (message: string, details?: unknown) => void;
  log: (data: unknown) => void;
}

export interface BlockSystem {
  evaluate(
    predicates: BlockCheck[],
    input: ToolExecuteBeforeInput,
    output: ToolExecuteBeforeOutput,
    scriptResults: ScriptResult[]
  ): BlockResult | null;
  evaluateWithEffects(
    predicates: BlockCheck[],
    input: ToolExecuteBeforeInput,
    output: ToolExecuteBeforeOutput,
    scriptResults: ScriptResult[],
    eventType: string
  ): void;
}

export function createBlockSystem(effects: BlockEffects): BlockSystem {
  return {
    evaluate(predicates, input, output, scriptResults) {
      if (!predicates || predicates.length === 0) {
        return null;
      }

      for (const predicate of predicates) {
        const blocked = predicate.check(input, output, scriptResults);
        if (blocked) {
          return {
            blocked: true,
            predicate,
            message: predicate.message || `Blocked: ${input.tool} execution`,
          };
        }
      }

      return null;
    },

    evaluateWithEffects(predicates, input, output, scriptResults, eventType) {
      const result = this.evaluate(predicates, input, output, scriptResults);
      if (result?.blocked) {
        effects.notify(`${input.tool.toUpperCase()} BEFORE - EVENT BLOCKED`, {
          message: result.message,
          eventType,
        });
        effects.log({
          timestamp: new Date().toISOString(),
          type: 'EVENT_BLOCKED',
          data: { eventType, input, output, blockCheck: result.predicate },
        });
        throw new Error(result.message);
      }
    },
  };
}
