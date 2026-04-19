import { createResolvers } from '../helpers';
import { createUserConfig } from '../helpers';

describe('events - resolveEventConfig', () => {
  it('should return defaults for event not listed', () => {
    const { eventResolver } = createResolvers(createUserConfig());
    const config = eventResolver.resolve('session.unknown');

    expect(config.enabled).toBe(true);
    expect(config.toast).toBe(true);
    expect(config.toastTitle).toBe('====UNKNOWN SESSION EVENT====');
    expect(config.toastVariant).toBe('warning');
    expect(config.toastDuration).toBe(5000);
    expect(config.scripts).toEqual([]);
    expect(config.saveToFile).toBe(true);
    expect(config.appendToSession).toBe(true);
  });

  it('should return toast: false when default toast is object with enabled: false', () => {
    const config = createUserConfig({
      default: { toast: { enabled: false } },
      events: { 'session.test': true },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.test');

    expect(result.toast).toBe(false);
  });
});

describe('events - resolveToolConfig', () => {
  it('should return enabled: false when global enabled is false', () => {
    const config = createUserConfig({
      enabled: false,
      events: { 'session.created': true },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.created');

    expect(result.enabled).toBe(false);
  });

  it('should return enabled: false for event config boolean false', () => {
    const config = createUserConfig({
      events: { 'session.test': false },
    });
    const { eventResolver } = createResolvers(config);
    const result = eventResolver.resolve('session.test');

    expect(result.enabled).toBe(false);
  });

  it('should return empty string when buildMessage throws', () => {
    const config = createUserConfig({
      events: { 'session.test': {} },
    });
    const { eventResolver } = createResolvers(config, {
      'session.test': {
        title: '====TEST====',
        variant: 'info',
        duration: 2000,
        defaultScript: 'session-test.sh',
        buildMessage: () => {
          throw new Error('Build error');
        },
      },
    });
    const result = eventResolver.resolve('session.test', { test: 'data' });

    expect(result.toastMessage).toBe('');
  });

  it('getToolHandler should return undefined for invalid toolEventType', () => {
    const config = createUserConfig();
    const { toolResolver } = createResolvers(config);
    const result = toolResolver.resolve('invalid', 'task');

    expect(result.enabled).toBe(true);
  });
});
