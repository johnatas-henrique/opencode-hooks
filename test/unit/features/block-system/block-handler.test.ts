import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '.opencode/plugins/types/core';
import type { TuiToast } from '@opencode-ai/plugin/tui';
import type { SecurityRecord } from '.opencode/plugins/types/audit';
import {
  initGlobalToastQueue,
  resetGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';
import { setSecurityRecorder } from '.opencode/plugins/features/audit/security-recorder';

import {
  createDefaultNotifyEffect,
  createDefaultLogEffect,
  getBlockSystem,
  executeBlocking,
} from '.opencode/plugins/features/block-system/block-handler';
import type { BlockCheck, ScriptResult } from '.opencode/plugins/types/config';

describe('block-handler', () => {
  let mockAdd: ReturnType<typeof vi.fn>;
  let mockLogSecurity: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAdd = vi.fn();
    mockLogSecurity = vi.fn().mockResolvedValue(undefined);
    resetGlobalToastQueue();
    initGlobalToastQueue(mockAdd as unknown as (toast: TuiToast) => void);
    setSecurityRecorder({
      logSecurity: mockLogSecurity as unknown as (
        input: SecurityRecord
      ) => Promise<void>,
    });
  });

  describe('createDefaultNotifyEffect', () => {
    it('calls toast queue add with error variant and 10s duration', async () => {
      vi.useFakeTimers();
      const notify = createDefaultNotifyEffect();
      notify('Test Title', { message: 'Test message' });

      await vi.advanceTimersByTimeAsync(500);

      expect(mockAdd).toHaveBeenCalledWith({
        title: 'Test Title',
        message: 'Test message',
        variant: 'error',
        duration: 10000,
      } satisfies TuiToast);
      vi.useRealTimers();
    });
  });

  describe('createDefaultLogEffect', () => {
    it('logs security event with correct data', async () => {
      const log = createDefaultLogEffect();
      await log({
        sessionID: 'ses_1',
        toolName: 'bash',
        rule: 'block-rule',
        reason: 'block reason',
        input: { tool: 'bash' },
      });
      expect(mockLogSecurity).toHaveBeenCalledWith({
        sessionID: 'ses_1',
        toolName: 'bash',
        rule: 'block-rule',
        reason: 'block reason',
        input: { tool: 'bash' },
      });
    });
  });

  describe('getBlockSystem', () => {
    it('returns a BlockSystem instance', () => {
      const system = getBlockSystem();
      expect(system).toBeDefined();
      expect(typeof system.evaluate).toBe('function');
      expect(typeof system.evaluateWithEffects).toBe('function');
    });
  });

  describe('defaultEffects.log via evaluateWithEffects', () => {
    it('calls securityRecorder when block check passes', () => {
      const system = getBlockSystem();
      const blockConfig: BlockCheck[] = [
        { check: () => true, message: 'default-block' },
      ];
      const input: ToolExecuteBeforeInput = {
        tool: 'bash',
        sessionID: 'ses_test',
        callID: 'call_1',
      };
      const output: ToolExecuteBeforeOutput = { args: { command: 'ls' } };
      const scriptResults: ScriptResult[] = [
        { script: 'test.sh', exitCode: 0 },
      ];

      expect(() => {
        system.evaluateWithEffects(
          blockConfig,
          input,
          output,
          scriptResults,
          'tool.execute.before'
        );
      }).toThrow('default-block');
      expect(mockLogSecurity).toHaveBeenCalled();
    });
  });

  describe('executeBlocking', () => {
    const input: ToolExecuteBeforeInput = {
      tool: 'bash',
      sessionID: 'ses_test',
      callID: 'call_1',
    };
    const output: ToolExecuteBeforeOutput = { args: { command: 'ls' } };
    const scriptResults = [{ script: 'test.sh', exitCode: 0 }];

    it('does nothing when blockConfig is empty', () => {
      executeBlocking([], input, output, scriptResults, 'tool.execute.before');
      expect(mockLogSecurity).not.toHaveBeenCalled();
    });

    it('calls securityRecorder with block config data', () => {
      const blockConfig: BlockCheck[] = [
        {
          check: () => true,
          message: 'blocked by rule',
        },
      ];
      expect(() => {
        executeBlocking(
          blockConfig,
          input,
          output,
          scriptResults,
          'tool.execute.before'
        );
      }).toThrow('blocked by rule');
      expect(mockLogSecurity).toHaveBeenCalled();
    });

    it('returns early without throwing when securityRecorder is null', () => {
      delete (globalThis as Record<string, unknown>)
        .__opencode_security_recorder;
      const blockConfig: BlockCheck[] = [
        { check: () => true, message: 'blocked' },
      ];
      executeBlocking(
        blockConfig,
        input,
        output,
        scriptResults,
        'tool.execute.before'
      );
      expect(mockLogSecurity).not.toHaveBeenCalled();
    });
  });
});
