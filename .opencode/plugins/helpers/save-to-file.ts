import { appendFile } from "fs/promises";
import { LOG_DIR, LOG_FILE } from "./constants";

const isValidFilename = (filename: string): boolean => {
  if (!filename || typeof filename !== 'string') return false;
  if (filename.length > 255) return false;
  const invalidChars = /[<>:"\\|?*\u0000-\u001f]/;
  return !invalidChars.test(filename);
};

export const saveToFile = async ({ content, filename = LOG_FILE }: { content: string, filename?: string }): Promise<void> => {
  const validFilename = isValidFilename(filename) ? filename : LOG_FILE;
  const contentTrimmed = content.trim().replace(/^\s+/gm, '') + "\n";
  await appendFile(`${LOG_DIR}/${validFilename}`, contentTrimmed);
};
