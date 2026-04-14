import { userConfig } from '../../.opencode/plugins/helpers/config/index';

describe('settings - block predicates', () => {
  it('blockEnvFiles should block files with .env in path', () => {
    const toolBefore = userConfig.tools['tool.execute.before'] as Record<
      string,
      {
        block?: Array<{
          check: (
            input: unknown,
            output: { args: { filePath: string } },
            results: unknown[]
          ) => boolean;
        }>;
      }
    >;
    const writeConfig = toolBefore.write?.block;
    expect(writeConfig).toBeDefined();
    expect(writeConfig).toHaveLength(1);

    const predicate = writeConfig![0].check;
    const mockOutput = { args: { filePath: '/path/to/.env' } };
    expect(predicate(undefined, mockOutput as never, [])).toBe(true);
  });

  it('blockEnvFiles should not block other files', () => {
    const toolBefore = userConfig.tools['tool.execute.before'] as Record<
      string,
      {
        block?: Array<{
          check: (
            input: unknown,
            output: { args: { filePath: string } },
            results: unknown[]
          ) => boolean;
        }>;
      }
    >;
    const writeConfig = toolBefore.write?.block;
    const predicate = writeConfig![0].check;

    const mockOutput = { args: { filePath: '/path/to/config.ts' } };
    expect(predicate(undefined, mockOutput as never, [])).toBe(false);
  });

  it('blockGitForce should block commands with --force', () => {
    const toolBefore = userConfig.tools['tool.execute.before'] as Record<
      string,
      {
        block?: Array<{
          check: (
            input: unknown,
            output: { args: { command: string } },
            results: unknown[]
          ) => boolean;
        }>;
      }
    >;
    const bashConfig = toolBefore.bash?.block;
    expect(bashConfig).toBeDefined();
    expect(bashConfig).toHaveLength(4);

    const predicate = bashConfig![1].check;
    const mockOutput = { args: { command: 'git push --force origin main' } };
    expect(predicate(undefined, mockOutput as never, [])).toBe(true);
  });

  it('blockGitForce should block commands with -f', () => {
    const toolBefore = userConfig.tools['tool.execute.before'] as Record<
      string,
      {
        block?: Array<{
          check: (
            input: unknown,
            output: { args: { command: string } },
            results: unknown[]
          ) => boolean;
        }>;
      }
    >;
    const bashConfig = toolBefore.bash?.block;
    const predicate = bashConfig![1].check;

    const mockOutput = { args: { command: 'git push -f origin main' } };
    expect(predicate(undefined, mockOutput as never, [])).toBe(true);
  });

  it('blockGitForce should not block safe commands', () => {
    const toolBefore = userConfig.tools['tool.execute.before'] as Record<
      string,
      {
        block?: Array<{
          check: (
            input: unknown,
            output: { args: { command: string } },
            results: unknown[]
          ) => boolean;
        }>;
      }
    >;
    const bashConfig = toolBefore.bash?.block;
    const predicate = bashConfig![1].check;

    const mockOutput = { args: { command: 'git push origin main' } };
    expect(predicate(undefined, mockOutput as never, [])).toBe(false);
  });

  it('blockScriptsFailed should block when script results have failures', () => {
    const toolBefore = userConfig.tools['tool.execute.before'] as Record<
      string,
      {
        block?: Array<{
          check: (
            input: unknown,
            output: { args: { command: string } },
            results: { exitCode: number }[]
          ) => boolean;
        }>;
      }
    >;
    const bashConfig = toolBefore.bash?.block;
    expect(bashConfig).toHaveLength(4);

    const predicate = bashConfig![3].check;
    const mockOutput = { args: { command: 'ls' } };
    const scriptResults = [{ script: 'test.sh', exitCode: 1, output: 'error' }];
    expect(predicate(undefined, mockOutput as never, scriptResults)).toBe(true);
  });

  it('blockScriptsFailed should not block when all scripts succeed', () => {
    const toolBefore = userConfig.tools['tool.execute.before'] as Record<
      string,
      {
        block?: Array<{
          check: (
            input: unknown,
            output: { args: { command: string } },
            results: { exitCode: number }[]
          ) => boolean;
        }>;
      }
    >;
    const bashConfig = toolBefore.bash?.block;

    const predicate = bashConfig![3].check;
    const mockOutput = { args: { command: 'ls' } };
    const scriptResults = [{ script: 'test.sh', exitCode: 0, output: 'ok' }];
    expect(predicate(undefined, mockOutput as never, scriptResults)).toBe(
      false
    );
  });

  it('blockByPath should block protected paths', () => {
    const toolBefore = userConfig.tools['tool.execute.before'] as Record<
      string,
      {
        block?: Array<{
          check: (
            input: unknown,
            output: { args: { filePath: string } },
            results: unknown[]
          ) => boolean;
        }>;
      }
    >;
    const readConfig = toolBefore.read?.block;
    expect(readConfig).toHaveLength(2);

    const predicate = readConfig![1].check;

    const mockOutput1 = { args: { filePath: '/path/to/credentials.json' } };
    expect(predicate(undefined, mockOutput1 as never, [])).toBe(true);

    const mockOutput2 = { args: { filePath: '/home/user/secrets/api.key' } };
    expect(predicate(undefined, mockOutput2 as never, [])).toBe(true);

    const mockOutput3 = { args: { filePath: '/home/user/.ssh/id_rsa' } };
    expect(predicate(undefined, mockOutput3 as never, [])).toBe(true);
  });

  it('blockByPath should not block allowed paths', () => {
    const toolBefore = userConfig.tools['tool.execute.before'] as Record<
      string,
      {
        block?: Array<{
          check: (
            input: unknown,
            output: { args: { filePath: string } },
            results: unknown[]
          ) => boolean;
        }>;
      }
    >;
    const readConfig = toolBefore.read?.block;
    const predicate = readConfig![1].check;

    const mockOutput = { args: { filePath: '/path/to/safe-file.ts' } };
    expect(predicate(undefined, mockOutput as never, [])).toBe(false);
  });
});

describe('settings - config exports', () => {
  it('should export userConfig with correct structure', () => {
    expect(userConfig).toBeDefined();
    expect(userConfig.enabled).toBe(true);
    expect(userConfig.default).toBeDefined();
    expect(userConfig.events).toBeDefined();
    expect(userConfig.tools).toBeDefined();
    expect(userConfig.scriptToasts).toBeDefined();
  });

  it('should have correct scriptToasts defaults', () => {
    expect(userConfig.scriptToasts.showOutput).toBe(true);
    expect(userConfig.scriptToasts.showError).toBe(true);
    expect(userConfig.scriptToasts.outputVariant).toBe('warning');
    expect(userConfig.scriptToasts.errorVariant).toBe('error');
    expect(userConfig.scriptToasts.outputTitle).toBe('- SCRIPTS OUTPUT');
    expect(userConfig.scriptToasts.errorTitle).toBe('- SCRIPT ERROR');
  });

  it('should have tool.execute.before configuration', () => {
    const toolBefore = userConfig.tools['tool.execute.before'];
    expect(toolBefore).toBeDefined();
    expect((toolBefore as Record<string, unknown>).bash).toBeDefined();
    expect((toolBefore as Record<string, unknown>).write).toBeDefined();
    expect((toolBefore as Record<string, unknown>).read).toBeDefined();
  });

  it('should have tool.execute.after configuration', () => {
    const toolAfter = userConfig.tools['tool.execute.after'];
    expect(toolAfter).toBeDefined();
    expect((toolAfter as Record<string, unknown>).task).toBeDefined();
    expect((toolAfter as Record<string, unknown>).skill).toBeDefined();
  });
});
