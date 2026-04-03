import { PluginInput } from '@opencode-ai/plugin';
import { saveToFile } from './save-to-file';
import { SCRIPTS_DIR } from './constants';

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
  try {
    const result =
      args.length > 0
        ? await $`./${SCRIPTS_DIR}/${scriptPath} ${args.join(' ')}`.quiet()
        : await $`./${SCRIPTS_DIR}/${scriptPath}`.quiet();
    return result.text();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await saveToFile({
      content: `[ERROR] Script ${scriptPath} failed: ${errorMessage}\n`,
    });
    throw error;
  }
};
