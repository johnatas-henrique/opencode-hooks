import type { EventVariant, ScriptEntry } from '.opencode/plugins/types/config';

export function createDefaultFs(): Record<string, unknown> {
  return {
    existsSync: () => true,
    readFileSync: () => '{}',
    readdirSync: () => [],
    writeFileSync: () => undefined,
    mkdirSync: () => undefined,
    unlinkSync: () => undefined,
    statSync: () => ({ isDirectory: () => true, size: 0 }),
    appendFileSync: () => undefined,
  };
}

export function createDefaultFsPromises(): Record<string, unknown> {
  return {
    appendFile: () => Promise.resolve(),
    mkdir: () => Promise.resolve(),
    readdir: () => Promise.resolve([]),
    rename: () => Promise.resolve(),
    stat: () => Promise.resolve({ size: 0, mtimeMs: 0 }),
    unlink: () => Promise.resolve(),
    readFile: () => Promise.resolve(''),
  };
}

export function createDefaultShell(): Record<string, unknown> {
  return {
    spawn: () => ({
      stdout: { on: () => undefined },
      stderr: { on: () => undefined },
      stdin: { write: () => undefined, end: () => undefined },
      on: () => undefined,
      unref: () => undefined,
    }),
  };
}

export function createDefaultSettings(): Record<string, unknown> {
  return {
    userConfig: {
      enabled: true,
      logDisabledEvents: false,
      showPluginStatus: true,
      pluginStatusDisplayMode: 'user-only',
      loadClaudeHookSettings: {
        loadGlobalClaudeHooks: false,
        loadLocalClaudeHooks: false,
      },
      scriptToasts: {
        showOutput: true,
        showError: true,
        outputVariant: 'info' as EventVariant,
        errorVariant: 'error' as EventVariant,
        outputDuration: 5000,
        errorDuration: 15000,
        outputTitle: 'Script Output',
        errorTitle: 'Script Error',
      },
      default: {
        debug: false,
        toast: false,
        runScripts: false,
        runOnlyOnce: false,
        logToAudit: true,
        appendToSession: false,
      },
      audit: {
        enabled: true,
        level: 'debug',
        basePath: '/tmp/test-audit',
        maxSizeMB: 1,
        maxAgeDays: 30,
        logTruncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
        largeFields: [
          'patch',
          'diff',
          'content',
          'snapshot',
          'output',
          'result',
          'text',
        ],
      },
      events: {},
      tools: {
        'tool.execute.after': {},
        'tool.execute.after.subagent': {},
        'tool.execute.before': {},
      },
    },
  };
}

export function createMockScriptEntry(path = 'test.sh'): ScriptEntry {
  return { source: 'native', path };
}
