import { describe, it, expect } from 'vitest';
import { ConfigBuilder } from '.opencode/plugins/features/events/resolvers/event-config-builder';
import { createContext } from '../../../../helpers/create-context';
import { createHandler } from '../../../../helpers/create-handler';
import { expectDefaults } from '../../../../helpers/config-assertions';

function buildConfig(overrides?: Parameters<typeof createContext>[0]) {
  const ctx = createContext(overrides);
  const builder = new ConfigBuilder(ctx, 'session.created');
  return builder.resolve();
}

describe('ConfigBuilder', () => {
  it('returns disabled config when context.enabled is false', () => {
    const result = buildConfig({ enabled: false });
    expectDefaults(result);
  });

  it('builds default config when no user event config exists', () => {
    const handler = createHandler({
      title: 'Test Event',
      variant: 'info',
      duration: 5000,
      defaultScript: 'test-event.sh',
      buildMessage: () => 'message',
    });
    const result = buildConfig({
      handlers: { 'session.created': handler },
      getEventConfig: () => undefined,
    });
    expect(result.enabled).toBe(true);
    expect(result.toastTitle).toBe('Test Event');
    expect(result.toastVariant).toBe('info');
    expect(result.toastDuration).toBe(5000);
  });

  it('uses user event config when present', () => {
    const handler = createHandler({
      title: 'Test Event',
      buildMessage: () => 'hi',
    });
    const result = buildConfig({
      handlers: { 'session.created': handler },
      getEventConfig: () => ({ toast: true, runScripts: true }),
    });
    expect(result.toast).toBe(true);
    expect(result.runScripts).toBe(true);
  });

  it('returns disabled config when event is disabled', () => {
    const result = buildConfig({
      getEventConfig: () => ({ enabled: false }),
    });
    expect(result.enabled).toBe(false);
    expect(result.toast).toBe(false);
  });

  it('returns disabled config when eventConfig is boolean false', () => {
    const result = buildConfig({
      getEventConfig: () => false,
    });
    expect(result.enabled).toBe(false);
  });

  it('includes claude scripts when runScripts is true', () => {
    const result = buildConfig({
      handlers: { 'session.created': createHandler() },
      getEventConfig: () => ({ runScripts: true }),
      getClaudeScripts: () => ({
        'session.created': [{ source: 'claude', path: 'claude.sh' }],
      }),
    });
    expect(result.runScripts).toBe(true);
    expect(result.scripts).toContainEqual({
      source: 'claude',
      path: 'claude.sh',
    });
  });

  it('returns empty toastTitle when no handler found', () => {
    const result = buildConfig({ getEventConfig: () => undefined });
    expect(result.toastTitle).toBe('');
  });

  it('uses allowedFields from user override', () => {
    const handler = createHandler({ allowedFields: ['default'] });
    const result = buildConfig({
      handlers: { 'session.created': handler },
      getEventConfig: () => ({ allowedFields: ['override'], enabled: true }),
    });
    expect(result.allowedFields).toEqual(['override']);
  });

  it('calls getDefaultScript when handler has no defaultScript', () => {
    const handler = createHandler({ defaultScript: undefined });
    const result = buildConfig({
      handlers: { 'session.created': handler },
      getEventConfig: () => ({ runScripts: true }),
    });
    expect(result.scripts[0]?.path).toBe('session-created.sh');
  });

  it('handles buildMessage that throws', () => {
    const handler = createHandler({
      buildMessage: () => {
        throw new Error('boom');
      },
    });
    const result = buildConfig({
      handlers: { 'session.created': handler },
      getEventConfig: () => ({ toast: true }),
    });
    expect(result.toastMessage).toBe('');
  });

  it('uses handler with custom buildMessage returning string', () => {
    const handler = createHandler({
      defaultScript: 'custom.sh',
      buildMessage: () => 'custom message',
    });
    const result = buildConfig({
      handlers: { 'session.created': handler },
      getEventConfig: () => undefined,
    });
    expect(result.toastMessage).toBe('custom message');
  });

  it('treats getEventConfig returning true as enabled and builds merged config', () => {
    const handler = createHandler({
      title: 'Test Event',
      defaultScript: 'test.sh',
      buildMessage: () => 'enabled message',
    });
    const result = buildConfig({
      handlers: { 'session.created': handler },
      getEventConfig: () => true,
    });
    expect(result.enabled).toBe(true);
    expect(result.toastMessage).toBe('enabled message');
  });
});
