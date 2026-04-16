import { buildToastMessage } from '../../.opencode/plugins/features/events/resolvers/build-message';
import type { ToastOverride } from '../../.opencode/plugins/types/config';

describe('buildToastMessage', () => {
  const fallback = 'Fallback Message';
  const input = { foo: 'bar' };
  const output = { result: 'ok' };

  it('should return fallback message if toastCfg is null', () => {
    expect(buildToastMessage(null, fallback, input, output)).toBe(fallback);
  });

  it('should return toastCfg.message if messageFn is absent and message is present', () => {
    const cfg: ToastOverride = { message: 'Custom Message' };
    expect(buildToastMessage(cfg, fallback, input, output)).toBe(
      'Custom Message'
    );
  });

  it('should return fallback message if messageFn is absent and message is absent', () => {
    const cfg: ToastOverride = {};
    expect(buildToastMessage(cfg, fallback, input, output)).toBe(fallback);
  });

  it('should return result of messageFn if it returns a string', () => {
    const cfg: ToastOverride = {
      messageFn: (i, o) => `Fn Message ${i.foo} ${o?.result}`,
    };
    expect(buildToastMessage(cfg, fallback, input, output)).toBe(
      'Fn Message bar ok'
    );
  });

  it('should return toastCfg.message if messageFn returns undefined and message is present', () => {
    const cfg: ToastOverride = {
      messageFn: () => undefined,
      message: 'Custom Message',
    };
    expect(buildToastMessage(cfg, fallback, input, output)).toBe(
      'Custom Message'
    );
  });

  it('should return fallback message if messageFn returns undefined and message is absent', () => {
    const cfg: ToastOverride = {
      messageFn: () => undefined,
    };
    expect(buildToastMessage(cfg, fallback, input, output)).toBe(fallback);
  });
});
