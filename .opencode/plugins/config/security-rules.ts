import type { BlockPredicate } from '../types/config';

export const blockEnvFiles: BlockPredicate = (_, output) =>
  (output.args.filePath as string)?.includes('.env');

export const blockGitForce: BlockPredicate = (_, output) => {
  const cmd = output.args.command as string;
  const tokens = cmd?.trim().split(/\s+/) ?? [];
  const isGit = tokens[0] === 'git';
  const hasForce = tokens.includes('--force') || tokens.includes('-f');

  return isGit && hasForce;
};

export const blockScriptsFailed: BlockPredicate = (_, __, results) =>
  results.some((r) => r.exitCode !== 0);

export const blockByPath =
  (patterns: string[]): BlockPredicate =>
  (_, output) =>
    patterns.some((p) => (output.args.filePath as string)?.includes(p));

export const blockNoVerify: BlockPredicate = (_, output) => {
  const cmd = output.args.command as string;
  return /\s(-(-)?no-verify)\b/.test(cmd ?? '');
};

export const blockProtectedBranch: BlockPredicate = (_, output) => {
  const cmd = output.args.command as string;
  if (!cmd || !/\bgit\s+push\b/.test(cmd)) return false;
  return /\b(main|master|develop)\b/.test(cmd);
};

export const blockSecrets: BlockPredicate = (_, output) => {
  const secretPatterns = [
    /api[_-]?key[=:]\s*["']?[\w-]+["']?/i,
    /token[=:]\s*["']?[\w-]+["']?/i,
    /secret[=:]\s*["']?[\w-]+["']?/i,
    /password[=:]\s*["']?[\w-]+["']?/i,
    /gh[pousr]_[a-zA-Z0-9]{36,}/i,
    /bearer\s+[\w-]+/i,
  ];

  function checkValue(val: unknown): boolean {
    if (typeof val === 'string') {
      return secretPatterns.some((pattern) => pattern.test(val));
    }
    if (val && typeof val === 'object') {
      for (const v of Object.values(val as Record<string, unknown>)) {
        if (checkValue(v)) return true;
      }
    }
    return false;
  }

  return checkValue(output.args);
};

export const blockLargeArgs: BlockPredicate = (_, output) => {
  const argsStr = JSON.stringify(output.args);
  return argsStr.length > 100000;
};
