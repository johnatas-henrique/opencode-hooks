import { describe, it, expect } from 'vitest';
import { DelegatingEventConfigResolver } from '.opencode/plugins/features/events/resolvers/event-config.resolver';
import { createContext } from '../../../../helpers/create-context';
import { createHandler } from '../../../../helpers/create-handler';

describe('DelegatingEventConfigResolver', () => {
  it('resolve delegates to ConfigBuilder', () => {
    const ctx = createContext({ enabled: false });
    const resolver = new DelegatingEventConfigResolver(ctx);
    const result = resolver.resolve('session.created');
    expect(result.enabled).toBe(false);
  });

  it('getHandler returns handler for event type', () => {
    const handler = createHandler({ title: 'My Handler' });
    const ctx = createContext({
      handlers: { 'session.created': handler },
    });
    const resolver = new DelegatingEventConfigResolver(ctx);
    expect(resolver.getHandler('session.created')).toBe(handler);
  });

  it('getHandler returns undefined for unknown event', () => {
    const ctx = createContext();
    const resolver = new DelegatingEventConfigResolver(ctx);
    expect(resolver.getHandler('unknown.event')).toBeUndefined();
  });

  it('getDefaultScript returns event-type-based filename', () => {
    const ctx = createContext();
    const resolver = new DelegatingEventConfigResolver(ctx);
    expect(resolver.getDefaultScript('session.created')).toBe(
      'session-created.sh'
    );
    expect(resolver.getDefaultScript('tool.execute.before')).toBe(
      'tool-execute-before.sh'
    );
  });

  it('resolve passes input and output to ConfigBuilder', () => {
    const handler = createHandler({
      buildMessage: (event) =>
        `Tool: ${(event.input as Record<string, unknown>).tool as string}`,
    });
    const ctx = createContext({
      handlers: { 'tool.execute.before': handler },
      getEventConfig: () => undefined,
    });
    const resolver = new DelegatingEventConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', { tool: 'bash' });
    expect(result.toastMessage).toBe('Tool: bash');
  });
});
