import {
  blockEnvFiles,
  blockGitForce,
  blockScriptsFailed,
  blockByPath,
  blockNoVerify,
  blockProtectedBranch,
  blockSecrets,
  blockLargeArgs,
} from '../../.opencode/plugins/config/security-rules';
import type { ToolExecuteBeforeOutput } from '../../.opencode/plugins/types/core';
import type { ScriptResult } from '../../.opencode/plugins/types/config';

describe('security-rules', () => {
  const mockInput = {
    tool: 'git',
    sessionID: '123',
    callID: 'call-1',
  };

  const mockOutput = (
    args: Record<string, unknown>
  ): ToolExecuteBeforeOutput => ({
    args,
  });

  const mockResults: ScriptResult[] = [];

  describe('blockEnvFiles', () => {
    it('should handle null filePath', () => {
      const output = mockOutput({ filePath: null });
      expect(blockEnvFiles(mockInput, output, mockResults)).toBeFalsy();
    });
  });

  describe('blockGitForce', () => {
    it('should not block normal git commands', () => {
      const output = mockOutput({ command: 'git status' });
      expect(blockGitForce(mockInput, output, mockResults)).toBe(false);
    });

    it('should not block when command is undefined', () => {
      const output = mockOutput({});
      expect(blockGitForce(mockInput, output, mockResults)).toBeFalsy();
    });
  });

  describe('blockScriptsFailed', () => {
    it('should not block when all scripts succeed', () => {
      const results: ScriptResult[] = [
        { script: 'test.sh', exitCode: 0, output: 'ok' },
      ];
      expect(blockScriptsFailed(mockInput, mockOutput({}), results)).toBe(
        false
      );
    });
  });

  describe('blockByPath', () => {
    it('should not block when filePath is undefined', () => {
      const blocker = blockByPath(['secret']);
      const output = mockOutput({});
      expect(blocker(mockInput, output, mockResults)).toBe(false);
    });
  });

  describe('blockNoVerify', () => {
    it('should not block when command is undefined', () => {
      const output = mockOutput({});
      expect(blockNoVerify(mockInput, output, mockResults)).toBe(false);
    });
  });

  describe('blockProtectedBranch', () => {
    it('should not block push to feature branch', () => {
      const output = mockOutput({
        command: 'git push origin feature/new-feature',
      });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(false);
    });

    it('should not block when command is undefined', () => {
      const output = mockOutput({});
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(false);
    });

    it('should block push to main', () => {
      const output = mockOutput({ command: 'git push origin main' });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(true);
    });

    it('should block push to master', () => {
      const output = mockOutput({ command: 'git push origin master' });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(true);
    });

    it('should block push to develop', () => {
      const output = mockOutput({ command: 'git push origin develop' });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(true);
    });

    it('should not block non-git commands', () => {
      const output = mockOutput({ command: 'npm run build' });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(false);
    });

    it('should not block git commands that are not push', () => {
      const output = mockOutput({ command: 'git status' });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(false);
    });

    it('should block main in any position', () => {
      const output = mockOutput({
        command: 'git push origin --set-upstream main',
      });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(true);
    });
  });

  describe('blockSecrets', () => {
    it('should be case insensitive', () => {
      const output = mockOutput({ args: { data: 'API_KEY=abc123' } });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(true);
    });

    it('should detect secrets in nested objects', () => {
      const output = mockOutput({
        args: { config: { data: 'api_key=secret123' } },
      });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(true);
    });

    it('should handle nested objects without secrets', () => {
      const output = mockOutput({
        args: { config: { settings: { enabled: true } } },
      });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(false);
    });

    it('should return false for non-secret values', () => {
      const output = mockOutput({ args: { data: 'hello world' } });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(false);
    });
  });

  describe('blockLargeArgs', () => {
    it('should handle exactly 100KB', () => {
      const exactData = 'x'.repeat(50000);
      const output = mockOutput({ data: exactData });
      const result = blockLargeArgs(mockInput, output, mockResults);
      expect(result).toBeFalsy();
    });
  });
});
