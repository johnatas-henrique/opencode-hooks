import { PluginInput } from '@opencode-ai/plugin';
import { DEFAULTS } from '../../core/constants';
import type { ScriptRunResult } from '../../types/scripts';

const shellSpecialChars = /[;&|`$(){}[\]<>\\!#*?"'\n\r]/g;

const sanitizeArg = (arg: string): string => {
  return arg.replace(shellSpecialChars, '\\$&');
};

const validateScriptPath = (scriptPath: string): boolean => {
  if (!scriptPath || typeof scriptPath !== 'string') return false;

  // Bloquear path traversal (..)
  if (scriptPath.includes('..')) return false;

  // Bloquear paths absolutos (Unix e Windows)
  if (scriptPath.startsWith('/') || scriptPath.startsWith('~')) return false;
  if (/^[a-zA-Z]:\\/.test(scriptPath)) return false;

  // Bloquear backslash (Windows path separator)
  if (scriptPath.includes('\\')) return false;

  // Permitir subdiretórios com / (ex: 'subdir/script.sh')

  return true;
};

export const runScript = async (
  $: PluginInput['$'],
  scriptPath: string,
  ...args: string[]
): Promise<ScriptRunResult> => {
  if (!validateScriptPath(scriptPath)) {
    return {
      output: '',
      error: `Invalid script path: ${scriptPath}`,
      exitCode: -1,
    };
  }

  const sanitizedArgs = args.map(sanitizeArg);

  try {
    let result;
    if (sanitizedArgs.length > 0) {
      result =
        await $`./${DEFAULTS.scripts.dir}/${scriptPath} ${sanitizedArgs}`.quiet();
    } else {
      result = await $`./${DEFAULTS.scripts.dir}/${scriptPath}`.quiet();
    }

    return {
      output: result.text(),
      error: null,
      exitCode: result.exitCode,
    };
  } catch (err) {
    return {
      output: '',
      error: err instanceof Error ? err.message : String(err),
      exitCode: -1,
    };
  }
};
