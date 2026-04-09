import { useGlobalToastQueue } from './toast-queue';
import { saveToFile } from './save-to-file';
import { TOAST_DURATION, DEBUG_LOG_FILE } from './constants';

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'auth',
  'credentials',
  'authorization',
  'privateKey',
  'private_key',
  'accessToken',
  'access_token',
];

export function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        SENSITIVE_KEYS.some((sensitiveKey) =>
          key.toLowerCase().includes(sensitiveKey.toLowerCase())
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => sanitizeData(item));
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return data;
}

export async function handleDebugLog(
  timestamp: string,
  title: string,
  data: unknown
): Promise<void> {
  const sanitizedData = sanitizeData(data);
  const debugMessage = JSON.stringify(sanitizedData, null, 2);

  useGlobalToastQueue().add({
    title,
    message: debugMessage,
    variant: 'info',
    duration: TOAST_DURATION.TEN_SECONDS,
  });

  await saveToFile({
    content: `[${timestamp}] - ${title}\n${debugMessage}\n`,
    filename: DEBUG_LOG_FILE,
    showToast: useGlobalToastQueue().add,
  });
}
