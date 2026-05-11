import { expect } from 'vitest';

export function expectDefaults(result: {
  enabled: boolean;
  toast: boolean;
  scripts: unknown[];
  runScripts: boolean;
}) {
  expect(result.enabled).toBe(false);
  expect(result.toast).toBe(false);
  expect(result.scripts).toEqual([]);
  expect(result.runScripts).toBe(false);
}
