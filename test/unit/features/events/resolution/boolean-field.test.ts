import { describe, it, expect } from 'vitest';
import { getBooleanField } from '.opencode/plugins/features/events/resolution/boolean-field';
import type { EventOverride } from '.opencode/plugins/types/config';

describe('getBooleanField', () => {
  const defaultCfg: EventOverride = {
    debug: true,
    toast: true,
    runScripts: false,
    runOnlyOnce: false,
    logToAudit: true,
    appendToSession: false,
  };

  it('delegates toast key to resolveToastEnabled with eventCfg object', () => {
    const result = getBooleanField(
      { enabled: true, toast: true },
      defaultCfg,
      'toast',
      false
    );
    expect(result).toBe(true);
  });

  it('delegates toast key to resolveToastEnabled with eventCfg boolean false', () => {
    const result = getBooleanField(false, defaultCfg, 'toast', true);
    expect(result).toBe(defaultCfg.toast === true);
  });

  it('delegates toast key to resolveDefaultToast with undefined defaultCfg', () => {
    const result = getBooleanField({ enabled: true }, undefined, 'toast', true);
    expect(result).toBe(false);
  });

  it('reads debug from eventCfg object', () => {
    const result = getBooleanField(
      { enabled: true, debug: true },
      defaultCfg,
      'debug',
      false
    );
    expect(result).toBe(true);
  });

  it('reads debug from defaultCfg when eventCfg is boolean', () => {
    const result = getBooleanField(true, defaultCfg, 'debug', false);
    expect(result).toBe(true);
  });

  it('falls back to defaultCfg when eventCfg is object but key is undefined', () => {
    const result = getBooleanField(
      { enabled: true },
      defaultCfg,
      'debug',
      false
    );
    expect(result).toBe(true);
  });

  it('uses fallback when eventCfg is boolean and defaultCfg has the key as false', () => {
    const result = getBooleanField(true, defaultCfg, 'runOnlyOnce', true);
    expect(result).toBe(false);
  });

  it('returns Boolean(eventCfg value) for object configs', () => {
    const result = getBooleanField(
      { enabled: true, runScripts: true },
      defaultCfg,
      'runScripts',
      false
    );
    expect(result).toBe(true);
  });

  it('coerces truthy values to boolean', () => {
    const result = getBooleanField(
      { enabled: true, runOnlyOnce: 1 as unknown as boolean },
      defaultCfg,
      'runOnlyOnce',
      false
    );
    expect(result).toBe(true);
  });

  it('reads value from defaultCfg when eventCfg is boolean and defaultCfg defines the key', () => {
    const result = getBooleanField(true, defaultCfg, 'appendToSession', true);
    expect(result).toBe(false);
  });

  it('uses fallback when defaultCfg is null', () => {
    const result = getBooleanField(
      true,
      null as unknown as EventOverride,
      'debug',
      true
    );
    expect(result).toBe(true);
  });
});
