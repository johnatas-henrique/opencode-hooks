import type { ToolExecuteBeforeInput, ToolExecuteBeforeOutput } from './core';
import type { BlockCheck, ScriptResult } from './config';

export interface BlockResult {
  blocked: boolean;
  predicate: BlockCheck;
  message: string;
}

export interface BlockEffects {
  notify: (title: string, details: { message: string }) => void;
  log: (data: unknown) => void | Promise<void>;
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
            message: predicate.message,
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
        });
        const logData = {
          timestamp: new Date().toISOString(),
          type: 'EVENT_BLOCKED',
          data: { eventType, input, output, blockCheck: result.predicate },
        };
        Promise.resolve(effects.log(logData)).catch(() => {});
        throw new Error(result.message);
      }
    },
  };
}
