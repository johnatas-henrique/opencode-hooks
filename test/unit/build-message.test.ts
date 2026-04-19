import { buildToastMessage } from '../../.opencode/plugins/features/events/resolvers/build-message';
import type { ToastOverride } from '../../.opencode/plugins/types/config';

describe('buildToastMessage', () => {
  const fallback = 'Fallback Message';
  const input = { foo: 'bar' };
  const output = { result: 'ok' };

  it('should return result of messageFn if it returns a string', () => {
    const cfg: ToastOverride = {
      messageFn: (i, o) => `Fn Message ${i.foo} ${o?.result}`,
    };
    expect(buildToastMessage(cfg, fallback, input, output)).toBe(
      'Fn Message bar ok'
    );
  });

  it('should return fallback message if messageFn returns undefined and message is absent', () => {
    const cfg: ToastOverride = {
      messageFn: () => undefined,
    };
    expect(buildToastMessage(cfg, fallback, input, output)).toBe(fallback);
  });
});
