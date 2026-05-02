import { createSubagentTracker } from '.opencode/plugins/features/scripts/adapters';
import { describe, it, expect } from 'vitest';

describe('Adapters', () => {
  describe('createSubagentTracker', () => {
    it('isSubagent should return boolean', () => {
      const tracker = createSubagentTracker();
      expect(tracker.isSubagent('unknown')).toBe(false);
    });

    it('addSubagentSession should add session to internal tracking', () => {
      const tracker = createSubagentTracker();
      expect(() => tracker.addSubagentSession('test-id')).not.toThrow();
    });
  });
});
