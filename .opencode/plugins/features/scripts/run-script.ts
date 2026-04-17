import { PluginInput } from '@opencode-ai/plugin';
import { SCRIPTS_DIR } from '../../core/constants';
import type { ScriptRunResult } from '../../types/scripts';

const shellSpecialChars = /[;&|`$(){}[\]<>\\!#*?"'\n\r]/g;

const sanitizeArg = (arg: string): string => {
  return arg.replace(shellSpecialChars, '\\$&');
};

const validateScriptPath = (scriptPath: string): boolean => {
  if (!scriptPath || typeof scriptPath !== 'string') return false;
  if (scriptPath.includes('..') || scriptPath.startsWith('/')) return false;
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
      result = await $`./${SCRIPTS_DIR}/${scriptPath} ${sanitizedArgs}`.quiet();
    } else {
      result = await $`./${SCRIPTS_DIR}/${scriptPath}`.quiet();
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
