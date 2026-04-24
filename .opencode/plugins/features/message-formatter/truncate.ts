import { MAX_TOAST_LENGTH } from '../../core/constants';

export function truncate(
  str: string,
  maxLength: number = MAX_TOAST_LENGTH
): string {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + '...';
  }
  return str;
}
