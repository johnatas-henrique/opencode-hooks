import { describe, it, expect } from 'vitest';
import {
  blockEnvFiles,
  blockGitForce,
  blockScriptsFailed,
  blockByPath,
  blockNoVerify,
  blockProtectedBranch,
  blockSecrets,
  blockLargeArgs,
} from '.opencode/plugins/config/security-rules';
import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '.opencode/plugins/types/core';

function makeInput(tool = 'bash'): ToolExecuteBeforeInput {
  return { tool, sessionID: 'ses_test', callID: 'call_1' };
}

function makeOutput(args: Record<string, unknown>): ToolExecuteBeforeOutput {
  return { args };
}

function makeScriptResult(exitCode: number) {
  return [{ script: 'test.sh', exitCode }];
}

describe('blockEnvFiles', () => {
  it('returns true for .env file paths', () => {
    const output = makeOutput({ filePath: '/project/.env' });
    expect(blockEnvFiles(makeInput(), output, [])).toBe(true);
  });

  it('returns true for .env.example file paths', () => {
    const output = makeOutput({ filePath: '/project/.env.example' });
    expect(blockEnvFiles(makeInput(), output, [])).toBe(true);
  });

  it('returns false for non-.env file paths', () => {
    const output = makeOutput({ filePath: '/project/index.ts' });
    expect(blockEnvFiles(makeInput(), output, [])).toBe(false);
  });

  it('returns undefined for undefined filePath', () => {
    const output = makeOutput({ command: 'ls' });
    expect(blockEnvFiles(makeInput(), output, [])).toBeUndefined();
  });
});

describe('blockGitForce', () => {
  it('returns true for git push --force', () => {
    const output = makeOutput({ command: 'git push --force' });
    expect(blockGitForce(makeInput(), output, [])).toBe(true);
  });

  it('returns true for git push -f', () => {
    const output = makeOutput({ command: 'git push -f origin main' });
    expect(blockGitForce(makeInput(), output, [])).toBe(true);
  });

  it('returns false for git push without force', () => {
    const output = makeOutput({ command: 'git push origin main' });
    expect(blockGitForce(makeInput(), output, [])).toBe(false);
  });

  it('returns false for non-git commands with --force', () => {
    const output = makeOutput({ command: 'npm install --force' });
    expect(blockGitForce(makeInput(), output, [])).toBe(false);
  });

  it('returns false for empty command', () => {
    const output = makeOutput({ command: '' });
    expect(blockGitForce(makeInput(), output, [])).toBe(false);
  });

  it('returns false when command is undefined', () => {
    const output = makeOutput({});
    expect(blockGitForce(makeInput(), output, [])).toBe(false);
  });
});

describe('blockScriptsFailed', () => {
  it('returns true when any script has non-zero exit code', () => {
    expect(
      blockScriptsFailed(makeInput(), makeOutput({}), makeScriptResult(1))
    ).toBe(true);
  });

  it('returns false when all scripts exit with 0', () => {
    expect(
      blockScriptsFailed(makeInput(), makeOutput({}), makeScriptResult(0))
    ).toBe(false);
  });

  it('returns false for empty results', () => {
    expect(blockScriptsFailed(makeInput(), makeOutput({}), [])).toBe(false);
  });
});

describe('blockByPath', () => {
  const blocked = blockByPath(['credentials.json', 'secrets/']);

  it('returns true for matching patterns', () => {
    const output = makeOutput({ filePath: '/app/credentials.json' });
    expect(blocked(makeInput(), output, [])).toBe(true);
  });

  it('returns true for nested secrets path', () => {
    const output = makeOutput({ filePath: '/app/secrets/key.pem' });
    expect(blocked(makeInput(), output, [])).toBe(true);
  });

  it('returns false for non-matching paths', () => {
    const output = makeOutput({ filePath: '/app/src/index.ts' });
    expect(blocked(makeInput(), output, [])).toBe(false);
  });

  it('returns false for undefined filePath', () => {
    const output = makeOutput({ command: 'ls' });
    expect(blocked(makeInput(), output, [])).toBe(false);
  });
});

describe('blockNoVerify', () => {
  it('returns true for --no-verify flag', () => {
    const output = makeOutput({ command: 'git commit --no-verify -m "msg"' });
    expect(blockNoVerify(makeInput(), output, [])).toBe(true);
  });

  it('returns true for -no-verify flag', () => {
    const output = makeOutput({ command: 'git commit -no-verify -m "msg"' });
    expect(blockNoVerify(makeInput(), output, [])).toBe(true);
  });

  it('returns false for commit with verify', () => {
    const output = makeOutput({ command: 'git commit -m "msg"' });
    expect(blockNoVerify(makeInput(), output, [])).toBe(false);
  });

  it('returns false for empty command', () => {
    const output = makeOutput({ command: '' });
    expect(blockNoVerify(makeInput(), output, [])).toBe(false);
  });

  it('returns false when command is undefined', () => {
    const output = makeOutput({});
    expect(blockNoVerify(makeInput(), output, [])).toBe(false);
  });
});

describe('blockProtectedBranch', () => {
  it('returns true for git push to main', () => {
    const output = makeOutput({ command: 'git push origin main' });
    expect(blockProtectedBranch(makeInput(), output, [])).toBe(true);
  });

  it('returns true for git push to master', () => {
    const output = makeOutput({ command: 'git push origin master' });
    expect(blockProtectedBranch(makeInput(), output, [])).toBe(true);
  });

  it('returns true for git push to develop', () => {
    const output = makeOutput({ command: 'git push origin develop' });
    expect(blockProtectedBranch(makeInput(), output, [])).toBe(true);
  });

  it('returns false for git push to feature branch', () => {
    const output = makeOutput({ command: 'git push origin feature/new' });
    expect(blockProtectedBranch(makeInput(), output, [])).toBe(false);
  });

  it('returns false for non-push git commands mentioning main', () => {
    const output = makeOutput({ command: 'git checkout main' });
    expect(blockProtectedBranch(makeInput(), output, [])).toBe(false);
  });

  it('returns false for empty command', () => {
    const output = makeOutput({ command: '' });
    expect(blockProtectedBranch(makeInput(), output, [])).toBe(false);
  });
});

describe('blockSecrets', () => {
  it('returns true when args contain api_key', () => {
    const output = makeOutput({ command: 'curl -H "api_key=sk-abc123"' });
    expect(blockSecrets(makeInput(), output, [])).toBe(true);
  });

  it('returns true when args contain token', () => {
    const output = makeOutput({ command: 'login token=ghp_abc123' });
    expect(blockSecrets(makeInput(), output, [])).toBe(true);
  });

  it('returns true when args contain password', () => {
    const output = makeOutput({ command: 'login password=mypassword' });
    expect(blockSecrets(makeInput(), output, [])).toBe(true);
  });

  it('returns true when args contain GH tokens (36+ chars)', () => {
    const output = makeOutput({
      command: 'ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    expect(blockSecrets(makeInput(), output, [])).toBe(true);
  });

  it('returns false when args are safe', () => {
    const output = makeOutput({ command: 'ls -la', filePath: '/tmp' });
    expect(blockSecrets(makeInput(), output, [])).toBe(false);
  });

  it('recursively checks nested objects', () => {
    const output = makeOutput({ nested: { deep: 'token=abc123' } });
    expect(blockSecrets(makeInput(), output, [])).toBe(true);
  });

  it('handles null values in nested args', () => {
    const output = makeOutput({ data: null, other: 'safe' });
    expect(blockSecrets(makeInput(), output, [])).toBe(false);
  });
});

describe('blockLargeArgs', () => {
  it('returns true when args serialized exceed 100000 chars', () => {
    const output = makeOutput({ data: 'x'.repeat(100001) });
    expect(blockLargeArgs(makeInput(), output, [])).toBe(true);
  });

  it('returns false when args are small', () => {
    const output = makeOutput({ command: 'ls' });
    expect(blockLargeArgs(makeInput(), output, [])).toBe(false);
  });
});
