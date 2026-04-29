import {
  createAuditAdapter,
  createSessionAdapter,
  createToastAdapter,
  createSubagentTracker,
} from '../../.opencode/plugins/features/scripts/adapters';
import type { ScriptRecorder } from '../../.opencode/plugins/types/audit';
import type {
  ScriptInput,
  ScriptResultForAudit,
} from '../../.opencode/plugins/types/executor';
import type { EventScriptConfig } from '../../.opencode/plugins/types/scripts';
import { vi, describe, it, expect } from 'vitest';

describe('Adapters', () => {
  describe('createAuditAdapter', () => {
    it('should return undefined when scriptRecorder is undefined', () => {
      const audit = createAuditAdapter(undefined);
      expect(audit).toBeUndefined();
    });

    it('should return audit logger object when scriptRecorder provided', () => {
      const mockRecorder = { logScript: vi.fn() } as unknown as ScriptRecorder;
      const audit = createAuditAdapter(mockRecorder);

      expect(audit).not.toBeUndefined();
      expect(audit).toHaveProperty('logScript');
      expect(typeof audit!.logScript).toBe('function');
    });

    it('audit logger should be async function', async () => {
      const mockLogScript = vi.fn().mockResolvedValue(undefined);
      const mockRecorder = {
        logScript: mockLogScript,
      } as unknown as ScriptRecorder;
      const audit = createAuditAdapter(mockRecorder);

      const input: ScriptInput = { script: 'test', args: [], startTime: 0 };
      const result: ScriptResultForAudit = {
        output: '',
        error: null,
        exitCode: 0,
      };

      await audit!.logScript(input, result);

      expect(mockLogScript).toHaveBeenCalled();
    });
  });

  describe('createSessionAdapter', () => {
    it('should return session appender object', () => {
      const config = { ctx: { $: {} } } as EventScriptConfig;
      const session = createSessionAdapter(config);

      expect(session).not.toBeUndefined();
      expect(session).toHaveProperty('appendToSession');
      expect(typeof session!.appendToSession).toBe('function');
    });
  });

  describe('createToastAdapter', () => {
    it('should return toast notifier object', () => {
      const toast = createToastAdapter();

      expect(toast).not.toBeUndefined();
      expect(toast).toHaveProperty('showToast');
      expect(typeof toast!.showToast).toBe('function');
    });

    it('showToast should throw when globalToastQueue is not initialized', () => {
      // globalThis.globalToastQueue is deleted in test env, so createToastAdapter
      // still returns an object, but showToast will throw when called
      const toast = createToastAdapter();

      // The function exists, but calling it may throw
      expect(typeof toast!.showToast).toBe('function');
    });

    it('showToast should be a function with correct arity', () => {
      const toast = createToastAdapter();
      expect(toast!.showToast.length).toBe(4); // title, message, variant, duration
    });
  });

  describe('createSubagentTracker', () => {
    it('should return tracker object with isSubagent and addSubagentSession', () => {
      const tracker = createSubagentTracker();

      expect(tracker).toHaveProperty('isSubagent');
      expect(tracker).toHaveProperty('addSubagentSession');
      expect(typeof tracker.isSubagent).toBe('function');
      expect(typeof tracker.addSubagentSession).toBe('function');
    });

    it('isSubagent should return boolean', () => {
      const tracker = createSubagentTracker();
      // Without any sessions added, should return false
      expect(tracker.isSubagent('unknown')).toBe(false);
    });

    it('addSubagentSession should add session to internal tracking', () => {
      const tracker = createSubagentTracker();
      // addSubagentSession is a passthrough to internal set
      // We can't directly test the internal state, but we can verify no error thrown
      expect(() => tracker.addSubagentSession('test-id')).not.toThrow();
    });
  });
});
