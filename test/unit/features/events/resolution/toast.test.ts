import { describe, it, expect } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  resolveToastOverride,
  resolveToastEnabled,
  resolveDefaultToast,
} from '.opencode/plugins/features/events/resolution/toast';
import type { EventOverride } from '.opencode/plugins/types/config';

describe('resolveToastOverride', () => {
  it('returns toast config when cfg is an object with toast object', () => {
    const cfg = { toast: { title: 'Custom', enabled: true } };
    const result = resolveToastOverride(cfg);
    expect(result).toEqual({ title: 'Custom', enabled: true });
  });

  it('returns null when cfg has toast boolean', () => {
    const cfg = { toast: true };
    expect(resolveToastOverride(cfg)).toBeNull();
  });

  it('returns null when cfg is boolean', () => {
    expect(resolveToastOverride(true)).toBeNull();
    expect(resolveToastOverride(false)).toBeNull();
  });

  it('returns null when toast is undefined', () => {
    const cfg = { enabled: true };
    expect(resolveToastOverride(cfg)).toBeNull();
  });

  it('returns null when cfg is null', () => {
    expect(
      resolveToastOverride(
        null as unknown as Parameters<typeof resolveToastOverride>[0]
      )
    ).toBeNull();
  });
});

describe('resolveToastEnabled', () => {
  const defaultCfg = fromPartial<EventOverride>({
    debug: false,
    toast: { enabled: true },
    runScripts: false,
    runOnlyOnce: false,
    logToAudit: true,
    appendToSession: false,
  });

  it('returns toast boolean from eventCfg object', () => {
    const eventCfg = { toast: true };
    const result = resolveToastEnabled(eventCfg, undefined);
    expect(result).toBe(true);
  });

  it('returns toast false from eventCfg object', () => {
    const eventCfg = { toast: false };
    const result = resolveToastEnabled(eventCfg, undefined);
    expect(result).toBe(false);
  });

  it('returns toast.enabled when toast is object', () => {
    const eventCfg = { toast: { enabled: true } };
    const result = resolveToastEnabled(eventCfg, undefined);
    expect(result).toBe(true);
  });

  it('defaults to true when toast is object without enabled field', () => {
    const eventCfg = { toast: { title: 'Custom' } };
    const result = resolveToastEnabled(eventCfg, undefined);
    expect(result).toBe(true);
  });

  it('calls resolveDefaultToast when toast is undefined in eventCfg', () => {
    const eventCfg = { enabled: true };
    const result = resolveToastEnabled(eventCfg, defaultCfg);
    expect(result).toBe(true);
  });

  it('calls resolveDefaultToast when eventCfg is boolean true', () => {
    const result = resolveToastEnabled(true, defaultCfg);
    expect(result).toBe(true);
  });

  it('calls resolveDefaultToast when eventCfg is boolean false', () => {
    const result = resolveToastEnabled(false, undefined);
    expect(result).toBe(false);
  });
});

describe('resolveDefaultToast', () => {
  it('returns false when defaultCfg is undefined', () => {
    expect(resolveDefaultToast(undefined)).toBe(false);
  });

  it('returns false when defaultCfg.toast is falsy', () => {
    expect(
      resolveDefaultToast(fromPartial<EventOverride>({ toast: false }))
    ).toBe(false);
  });

  it('returns true when defaultCfg.toast is true', () => {
    expect(
      resolveDefaultToast(fromPartial<EventOverride>({ toast: true }))
    ).toBe(true);
  });

  it('returns toast.enabled when defaultCfg.toast is an object with enabled true', () => {
    const result = resolveDefaultToast({
      debug: false,
      toast: { enabled: true },
      runScripts: false,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: false,
    });
    expect(result).toBe(true);
  });

  it('returns toast.enabled when defaultCfg.toast is an object with enabled false', () => {
    const result = resolveDefaultToast({
      debug: false,
      toast: { enabled: false },
      runScripts: false,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: false,
    });
    expect(result).toBe(false);
  });

  it('returns true when defaultCfg.toast is object without enabled', () => {
    const result = resolveDefaultToast({
      debug: false,
      toast: { title: 'test' },
      runScripts: false,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: false,
    });
    expect(result).toBe(true);
  });
});
