import { appendFile, mkdir } from 'fs/promises';
import { LOG_DIR, LOG_FILE } from './constants';

const isValidFilename = (filename: string): boolean => {
  if (!filename || typeof filename !== 'string') return false;
  if (filename.length > 255) return false;
  const invalidChars = /[<>:"\\|?*]/;
  if (invalidChars.test(filename)) return false;
  for (let i = 0; i < filename.length; i++) {
    if (filename.charCodeAt(i) < 32) return false;
  }
  return true;
};

export const saveToFile = async ({
  content,
  filename = LOG_FILE,
}: {
  content: string;
  filename?: string;
}): Promise<void> => {
  try {
    const validFilename = isValidFilename(filename) ? filename : LOG_FILE;
    const contentTrimmed = content.trim().replace(/^\s+/gm, '') + '\n';
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(`${LOG_DIR}/${validFilename}`, contentTrimmed);
  } catch {
    // Silently fail - logging should not break the event pipeline
  }
};
