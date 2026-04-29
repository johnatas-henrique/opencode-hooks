import { DEFAULTS } from '../../core/constants';

export function truncate(
  str: string,
  maxLength: number = DEFAULTS.core.maxToastLength
): string {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + '...';
  }
  return str;
}
