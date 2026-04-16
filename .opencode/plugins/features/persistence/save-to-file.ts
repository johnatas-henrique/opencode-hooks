import { appendFile, mkdir } from 'fs/promises';
import { LOG_DIR, LOG_FILE, TOAST_DURATION } from '../../core/constants';

export type ToastCallback = (params: {
  title: string;
  message: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}) => void | Promise<void>;

let dirCreated = false;

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
  showToast,
}: {
  content: string;
  filename?: string;
  showToast?: ToastCallback;
}): Promise<void> => {
  try {
    const validFilename = isValidFilename(filename) ? filename : LOG_FILE;
    const contentTrimmed = content.trim().replace(/^\s+/gm, '') + '\n';
    if (!dirCreated) {
      await mkdir(LOG_DIR, { recursive: true });
      dirCreated = true;
    }
    await appendFile(`${LOG_DIR}/${validFilename}`, contentTrimmed);
  } catch (error) {
    if (showToast) {
      const errMsg = error instanceof Error ? error.message : String(error);
      await showToast({
        title: '====SAVE TO FILE ERROR====',
        message: errMsg,
        variant: 'error',
        duration: TOAST_DURATION.FIVE_SECONDS,
      });
    }
  }
};
