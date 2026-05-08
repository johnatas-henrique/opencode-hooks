import { describe, it, expect, vi } from 'vitest';

const mockFs = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));
vi.mock('fs', () => ({ default: mockFs }));

import { createUserConfig } from '../../helpers/create-config';
import {
  createContext,
  createEventResolver,
  createToolResolver,
} from '.opencode/plugins/features/events/context';
import type { EventHandler } from '.opencode/plugins/types/events';

describe('createContext', () => {
  it('creates a ConfigResolverContext from UserEventsConfig', () => {
    const userCfg = createUserConfig({ enabled: true });
    const ctx = createContext(userCfg);
    expect(ctx.enabled).toBe(true);
    expect(ctx.default).toBeDefined();
    expect(typeof ctx.getEventConfig).toBe('function');
    expect(typeof ctx.getToolConfigs).toBe('function');
  });

  it('delegates getEventConfig to userConfig.events', () => {
    const userCfg = createUserConfig({
      events: { 'session.created': { toast: true } },
    });
    const ctx = createContext(userCfg);
    const cfg = ctx.getEventConfig('session.created') as Record<
      string,
      unknown
    >;
    expect(cfg?.toast).toBe(true);
  });

  it('delegates getToolConfigs to userConfig.tools', () => {
    const userCfg = createUserConfig();
    const ctx = createContext(userCfg);
    const bashCfg = ctx.getToolConfigs('tool.execute.before') as Record<
      string,
      unknown
    >;
    expect(bashCfg).toBeDefined();
  });

  it('returns empty claude scripts by default', () => {
    const userCfg = createUserConfig();
    const ctx = createContext(userCfg);
    expect(ctx.getClaudeScripts('/test')).toEqual({});
  });

  it('provides scriptToasts from config', () => {
    const userCfg = createUserConfig({
      scriptToasts: {
        showOutput: false,
        showError: false,
        outputVariant: 'info',
        errorVariant: 'error',
        outputDuration: 5000,
        errorDuration: 10000,
        outputTitle: '',
        errorTitle: '',
      },
    });
    const ctx = createContext(userCfg);
    expect(ctx.scriptToasts.showOutput).toBe(false);
    expect(ctx.scriptToasts.showError).toBe(false);
  });

  it('uses custom eventHandlers when provided', () => {
    const customHandler: EventHandler = {
      title: 'Custom',
      variant: 'info',
      duration: 3000,
      defaultScript: 'custom.sh',
      buildMessage: () => 'custom',
    };
    const userCfg = createUserConfig();
    const ctx = createContext(userCfg, {
      'session.created': customHandler,
    });
    expect(ctx.handlers['session.created']).toBe(customHandler);
  });

  it('loads claude settings when loadClaudeHookSettings is enabled', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: { app: 'bash' },
              hooks: [{ command: 'hook.sh' }],
            },
          ],
        },
      })
    );
    const userCfg = createUserConfig({
      loadClaudeHookSettings: {
        loadGlobalClaudeHooks: true,
        loadLocalClaudeHooks: true,
      },
    });
    const ctx = createContext(userCfg);
    const scripts = ctx.getClaudeScripts('/test');
    expect(scripts).not.toEqual({});
  });
});

describe('createEventResolver', () => {
  it('returns an EventConfigResolver that resolves events', () => {
    const userCfg = createUserConfig({
      events: { 'session.created': { toast: true } },
    });
    const resolver = createEventResolver(userCfg);
    const result = resolver.resolve('session.created');
    expect(result.enabled).toBe(true);
  });

  it('returns undefined event config as default', () => {
    const userCfg = createUserConfig();
    const resolver = createEventResolver(userCfg);
    const result = resolver.resolve('unknown.event');
    expect(result.enabled).toBe(true);
  });

  it('resolves handler from config context', () => {
    const userCfg = createUserConfig();
    const resolver = createEventResolver(userCfg);
    const result = resolver.resolve('session.created');
    expect(result.enabled).toBe(true);
  });
});

describe('createToolResolver', () => {
  it('returns a ToolConfigResolver that resolves tool configs', () => {
    const userCfg = createUserConfig();
    const resolver = createToolResolver(userCfg);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.enabled).toBe(true);
  });

  it('handles tool.execute.after event type', () => {
    const userCfg = createUserConfig();
    const resolver = createToolResolver(userCfg);
    const result = resolver.resolve('tool.execute.after', 'bash');
    expect(result).toBeDefined();
  });
});
