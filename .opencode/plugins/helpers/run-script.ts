import { PluginInput } from "@opencode-ai/plugin";
import { saveToFile } from "./save-to-file";

const SCRIPTS_DIR = ".opencode/scripts";

export const runScript = async (
  $: PluginInput["$"],
  scriptPath: string,
  ...args: string[]
): Promise<string> => {
  try {
    const result =
      args.length > 0
        ? await $`./${SCRIPTS_DIR}/${scriptPath} ${args.join(" ")}`.quiet()
        : await $`./${SCRIPTS_DIR}/${scriptPath}`.quiet();
    return result.text();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    await saveToFile({
      content: `[ERROR] Script ${scriptPath} failed: ${errorMessage}\n`,
    });
    throw error;
  }
};
