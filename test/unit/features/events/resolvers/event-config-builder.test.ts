import { describe, it, expect } from 'vitest';
import { ConfigBuilder } from '.opencode/plugins/features/events/resolvers/event-config-builder';
import { createContext } from '../../../helpers/create-context';
import { createHandler } from '../../../helpers/create-handler';

describe('ConfigBuilder', () => {
  it('returns disabled config when context.enabled is false', () => {
    const ctx = createContext({ enabled: false });
    const builder = new ConfigBuilder(ctx, 'session.created');
    const result = builder.resolve();
    expect(result.enabled).toBe(false);
    expect(result.toast).toBe(false);
    expect(result.scripts).toEqual([]);
    expect(result.runScripts).toBe(false);
  });

  it('builds default config when no user event config exists', () => {
    const handler = createHandler({
      title: 'Test Event',
      variant: 'info',
      duration: 5000,
      defaultScript: 'test-event.sh',
      buildMessage: () => 'message',
    });
    const ctx = createContext({
      handlers: { 'session.created': handler },
      getEventConfig: () => undefined,
    });
    const builder = new ConfigBuilder(ctx, 'session.created');
    const result = builder.resolve();
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
    const ctx = createContext({
      handlers: { 'session.created': handler },
      getEventConfig: () => ({ toast: true, runScripts: true }),
    });
    const builder = new ConfigBuilder(ctx, 'session.created');
    const result = builder.resolve();
    expect(result.toast).toBe(true);
    expect(result.runScripts).toBe(true);
  });

  it('returns disabled config when event is disabled', () => {
    const ctx = createContext({
      getEventConfig: () => ({ enabled: false }),
    });
    const builder = new ConfigBuilder(ctx, 'session.created');
    const result = builder.resolve();
    expect(result.enabled).toBe(false);
    expect(result.toast).toBe(false);
  });

  it('returns disabled config when eventConfig is boolean false', () => {
    const ctx = createContext({
      getEventConfig: () => false,
    });
    const builder = new ConfigBuilder(ctx, 'session.created');
    const result = builder.resolve();
    expect(result.enabled).toBe(false);
  });

  it('includes claude scripts when runScripts is true', () => {
    const ctx = createContext({
      handlers: { 'session.created': createHandler() },
      getEventConfig: () => ({ runScripts: true }),
      claudeScripts: {
        'session.created': [{ source: 'claude', path: 'claude.sh' }],
      },
    });
    const builder = new ConfigBuilder(ctx, 'session.created');
    const result = builder.resolve();
    expect(result.runScripts).toBe(true);
    expect(result.scripts).toContainEqual({
      source: 'claude',
      path: 'claude.sh',
    });
  });
});
