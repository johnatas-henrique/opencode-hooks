import type {
  EventConfig,
  ToastOverride,
  EventOverride,
} from '../../../types/config';

export function resolveToastOverride(cfg: EventConfig): ToastOverride | null {
  if (
    typeof cfg === 'object' &&
    cfg !== null &&
    typeof cfg.toast === 'object' &&
    cfg.toast !== null
  ) {
    return cfg.toast;
  }
  return null;
}

export function resolveToastEnabled(
  eventCfg: EventConfig,
  defaultCfg: EventOverride | undefined
): boolean {
  if (typeof eventCfg === 'object' && eventCfg !== null) {
    const toast = eventCfg.toast;
    if (toast === undefined) {
      return resolveDefaultToast(defaultCfg);
    }
    if (typeof toast === 'boolean') {
      return toast;
    }
    if (typeof toast === 'object') {
      return toast.enabled ?? true;
    }
  }
  return resolveDefaultToast(defaultCfg);
}

export function resolveDefaultToast(
  defaultCfg: EventOverride | undefined
): boolean {
  if (!defaultCfg?.toast) {
    return false;
  }
  if (typeof defaultCfg.toast === 'boolean') {
    return defaultCfg.toast;
  }
  return defaultCfg.toast.enabled ?? true;
}
