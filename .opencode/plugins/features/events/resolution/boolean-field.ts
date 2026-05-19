import type {
  EventConfig,
  EventOverride,
} from '.opencode/plugins/types/config';
import { resolveToastEnabled } from '.opencode/plugins/features/events/resolution/toast';

export function getBooleanField(
  eventCfg: EventConfig,
  defaultCfg: EventOverride | undefined,
  key: keyof Omit<EventOverride, 'toast'> | 'toast',
  fallback: boolean
): boolean {
  if (key === 'toast') {
    return resolveToastEnabled(eventCfg, defaultCfg);
  }

  if (typeof eventCfg === 'object' && eventCfg !== null) {
    const eventValue = eventCfg[key];
    if (eventValue !== undefined) {
      return Boolean(eventValue);
    }
  }
  if (defaultCfg !== null && defaultCfg !== undefined) {
    const defaultValue = defaultCfg[key];
    if (defaultValue !== undefined) {
      return Boolean(defaultValue);
    }
  }
  return fallback;
}
