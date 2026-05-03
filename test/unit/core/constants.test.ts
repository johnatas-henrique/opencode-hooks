import { describe, it, expect } from 'vitest';
import { DEFAULTS } from '.opencode/plugins/core/constants';

describe('DEFAULTS', () => {
  it('has toast.durations with correct values', () => {
    expect(DEFAULTS.toast.durations.TWO_SECONDS).toBe(2000);
    expect(DEFAULTS.toast.durations.FIVE_SECONDS).toBe(5000);
    expect(DEFAULTS.toast.durations.EIGHT_SECONDS).toBe(8000);
    expect(DEFAULTS.toast.durations.TEN_SECONDS).toBe(10000);
    expect(DEFAULTS.toast.durations.FIFTEEN_SECONDS).toBe(15000);
    expect(DEFAULTS.toast.durations.THIRTY_SECONDS).toBe(30000);
  });

  it('has toast.timeouts with correct values', () => {
    expect(DEFAULTS.toast.timeouts.ONE_SECOND_AND_HALF).toBe(1500);
  });

  it('has toast.stagger with correct values', () => {
    expect(DEFAULTS.toast.stagger.DEFAULT).toBe(300);
    expect(DEFAULTS.toast.stagger.QUEUE).toBe(500);
  });

  it('has toast.timer with correct values', () => {
    expect(DEFAULTS.toast.timer.OVERWRITE_CHECK_DELAY).toBe(2500);
    expect(DEFAULTS.toast.timer.OVERWRITE_CHECK_INTERVAL).toBe(3000);
  });

  it('has scripts.dir', () => {
    expect(DEFAULTS.scripts.dir).toBe('.opencode/scripts');
  });

  it('has core config with correct values', () => {
    expect(DEFAULTS.core.defaultSessionId).toBe('unknown');
    expect(DEFAULTS.core.maxPromptLength).toBe(10000);
    expect(DEFAULTS.core.maxToastLength).toBe(1000);
    expect(DEFAULTS.core.tool.TASK).toBe('task');
    expect(DEFAULTS.core.tool.SUBAGENT_TYPE_ARG).toBe('subagent_type');
  });

  it('has audit.files with correct names', () => {
    expect(DEFAULTS.audit.files.events).toBe('plugin-events.json');
    expect(DEFAULTS.audit.files.scripts).toBe('plugin-scripts.json');
    expect(DEFAULTS.audit.files.errors).toBe('plugin-errors.json');
    expect(DEFAULTS.audit.files.security).toBe('plugin-security.json');
    expect(DEFAULTS.audit.files.debug).toBe('plugin-debug.json');
  });

  it('has config.disabled with all fields set', () => {
    const disabled = DEFAULTS.config.disabled;
    expect(disabled.enabled).toBe(false);
    expect(disabled.debug).toBe(false);
    expect(disabled.toast).toBe(false);
    expect(disabled.toastTitle).toBe('');
    expect(disabled.toastMessage).toBe('');
    expect(disabled.toastVariant).toBe('info');
    expect(disabled.toastDuration).toBe(0);
    expect(disabled.scripts).toEqual([]);
    expect(disabled.runScripts).toBe(false);
    expect(disabled.logToAudit).toBe(false);
    expect(disabled.appendToSession).toBe(false);
    expect(disabled.runOnlyOnce).toBe(false);
    expect(disabled.scriptToasts.showOutput).toBe(true);
    expect(disabled.scriptToasts.showError).toBe(true);
    expect(disabled.scriptToasts.outputVariant).toBe('info');
    expect(disabled.scriptToasts.errorVariant).toBe('error');
    expect(disabled.scriptToasts.outputDuration).toBe(5000);
    expect(disabled.scriptToasts.errorDuration).toBe(15000);
    expect(disabled.scriptToasts.outputTitle).toBe('Script Output');
    expect(disabled.scriptToasts.errorTitle).toBe('Script Error');
  });
});
