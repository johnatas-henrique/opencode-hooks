import { PluginInput } from '@opencode-ai/plugin';
import { SCRIPTS_DIR } from './constants';

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
): Promise<string> => {
  if (!validateScriptPath(scriptPath)) {
    throw new Error(`Invalid script path: ${scriptPath}`);
  }

  const sanitizedArgs = args.map(sanitizeArg);

  if (sanitizedArgs.length > 0) {
    const result =
      await $`./${SCRIPTS_DIR}/${scriptPath} ${sanitizedArgs}`.quiet();
    return result.text();
  }

  const result = await $`./${SCRIPTS_DIR}/${scriptPath}`.quiet();
  return result.text();
};
