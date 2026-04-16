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
    it('should block filePath containing .env', () => {
      const output = mockOutput({ filePath: '/path/to/.env' });
      expect(blockEnvFiles(mockInput, output, mockResults)).toBe(true);
    });

    it('should not block other files', () => {
      const output = mockOutput({ filePath: '/path/to/file.ts' });
      expect(blockEnvFiles(mockInput, output, mockResults)).toBe(false);
    });

    it('should not block when filePath is undefined', () => {
      const output = mockOutput({});
      expect(blockEnvFiles(mockInput, output, mockResults)).toBeFalsy();
    });

    it('should handle null filePath', () => {
      const output = mockOutput({ filePath: null });
      expect(blockEnvFiles(mockInput, output, mockResults)).toBeFalsy();
    });
  });

  describe('blockGitForce', () => {
    it('should block command with --force', () => {
      const output = mockOutput({ command: 'git push --force origin main' });
      expect(blockGitForce(mockInput, output, mockResults)).toBe(true);
    });

    it('should block command with -f', () => {
      const output = mockOutput({ command: 'git push -f origin main' });
      expect(blockGitForce(mockInput, output, mockResults)).toBe(true);
    });

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
    it('should block when any script fails', () => {
      const results: ScriptResult[] = [
        { script: 'test.sh', exitCode: 0, output: 'ok' },
        { script: 'fail.sh', exitCode: 1, output: 'error' },
      ];
      expect(blockScriptsFailed(mockInput, mockOutput({}), results)).toBe(true);
    });

    it('should not block when all scripts succeed', () => {
      const results: ScriptResult[] = [
        { script: 'test.sh', exitCode: 0, output: 'ok' },
      ];
      expect(blockScriptsFailed(mockInput, mockOutput({}), results)).toBe(
        false
      );
    });

    it('should not block empty results', () => {
      expect(blockScriptsFailed(mockInput, mockOutput({}), [])).toBe(false);
    });
  });

  describe('blockByPath', () => {
    it('should block when path matches pattern', () => {
      const blocker = blockByPath(['node_modules', '.git']);
      const output = mockOutput({ filePath: '/project/node_modules/package' });
      expect(blocker(mockInput, output, mockResults)).toBe(true);
    });

    it('should not block when path does not match', () => {
      const blocker = blockByPath(['node_modules', '.git']);
      const output = mockOutput({ filePath: '/project/src/index.ts' });
      expect(blocker(mockInput, output, mockResults)).toBe(false);
    });

    it('should not block when filePath is undefined', () => {
      const blocker = blockByPath(['secret']);
      const output = mockOutput({});
      expect(blocker(mockInput, output, mockResults)).toBe(false);
    });
  });

  describe('blockNoVerify', () => {
    it('should block with --no-verify', () => {
      const output = mockOutput({
        command: 'git commit --no-verify -m "test"',
      });
      expect(blockNoVerify(mockInput, output, mockResults)).toBe(true);
    });

    it('should block with -no-verify', () => {
      const output = mockOutput({ command: 'git commit -no-verify -m "test"' });
      expect(blockNoVerify(mockInput, output, mockResults)).toBe(true);
    });

    it('should not block normal commits', () => {
      const output = mockOutput({ command: 'git commit -m "test"' });
      expect(blockNoVerify(mockInput, output, mockResults)).toBe(false);
    });

    it('should not block when command is undefined', () => {
      const output = mockOutput({});
      expect(blockNoVerify(mockInput, output, mockResults)).toBe(false);
    });
  });

  describe('blockProtectedBranch', () => {
    it('should block push to main branch', () => {
      const output = mockOutput({ command: 'git push origin main' });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(true);
    });

    it('should block push to master branch', () => {
      const output = mockOutput({ command: 'git push origin master' });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(true);
    });

    it('should block push to develop branch', () => {
      const output = mockOutput({ command: 'git push origin develop' });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(true);
    });

    it('should not block push to feature branch', () => {
      const output = mockOutput({
        command: 'git push origin feature/new-feature',
      });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(false);
    });

    it('should not block non-push commands', () => {
      const output = mockOutput({ command: 'git status' });
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(false);
    });

    it('should not block when command is undefined', () => {
      const output = mockOutput({});
      expect(blockProtectedBranch(mockInput, output, mockResults)).toBe(false);
    });
  });

  describe('blockSecrets', () => {
    it('should block api_key pattern', () => {
      const output = mockOutput({ args: { data: 'api_key=abc123' } });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(true);
    });

    it('should block token pattern', () => {
      const output = mockOutput({ args: { data: 'token=abc123' } });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(true);
    });

    it('should block secret pattern', () => {
      const output = mockOutput({ args: { data: 'secret=abc123' } });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(true);
    });

    it('should block password pattern', () => {
      const output = mockOutput({ args: { data: 'password=abc123' } });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(true);
    });

    it('should block GitHub token pattern', () => {
      const output = mockOutput({
        args: { data: 'ghp_abcdefghijklmnopqrstuvwxyz1234567890' },
      });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(true);
    });

    it('should block bearer token pattern', () => {
      const output = mockOutput({ args: { data: 'bearer abc-def-ghi' } });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(true);
    });

    it('should not block normal data', () => {
      const output = mockOutput({
        args: { data: 'normal text without secrets' },
      });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(false);
    });

    it('should be case insensitive', () => {
      const output = mockOutput({ args: { data: 'API_KEY=abc123' } });
      expect(blockSecrets(mockInput, output, mockResults)).toBe(true);
    });
  });

  describe('blockLargeArgs', () => {
    it('should block args larger than 100KB', () => {
      const largeData = 'x'.repeat(100001);
      const output = mockOutput({ data: largeData });
      expect(blockLargeArgs(mockInput, output, mockResults)).toBe(true);
    });

    it('should not block args smaller than 100KB', () => {
      const output = mockOutput({ data: 'small data' });
      expect(blockLargeArgs(mockInput, output, mockResults)).toBe(false);
    });

    it('should handle exactly 100KB', () => {
      const exactData = 'x'.repeat(50000);
      const output = mockOutput({ data: exactData });
      const result = blockLargeArgs(mockInput, output, mockResults);
      expect(result).toBeFalsy();
    });
  });
});
