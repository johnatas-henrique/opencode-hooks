import { TRUNCATE_LENGTH } from '../../core/constants';

export { TRUNCATE_LENGTH };

export function truncate(
  str: string,
  maxLength: number = TRUNCATE_LENGTH
): string {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + '...';
  }
  return str;
}
