import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEventResolver,
  createToolResolver,
  createContext,
} from '.opencode/plugins/features/events/context';
import { userConfig } from '.opencode/plugins/config/settings';
import { handlers } from '.opencode/plugins/features/handlers';
import type { UserEventsConfig } from '.opencode/plugins/types/config';
import type {
  EventConfigResolver,
  ToolConfigResolver,
} from '.opencode/plugins/types/events';

describe('EventConfigResolver integration', () => {
  let resolver: EventConfigResolver;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('resolves session.created event with custom config', () => {
    const configWithScripts: UserEventsConfig = {
      ...userConfig,
      events: {
        'session.created': {
          enabled: true,
          runScripts: true,
          scripts: [{ source: 'native', path: 'test.sh' }],
        },
      },
    };

    resolver = createEventResolver(configWithScripts);

    const result = resolver.resolve('session.created', {}, {});
    expect(result.enabled).toBe(true);
    expect(result.runScripts).toBe(true);
    expect(result.scripts).toHaveLength(1);
  });

  it('resolves known event without custom config uses defaults', () => {
    resolver = createEventResolver(userConfig);

    const result = resolver.resolve('session.created', {}, {});
    expect(result.enabled).toBe(true);
  });

  it('resolves event with disabled config', () => {
    const configDisabled: UserEventsConfig = {
      ...userConfig,
      events: {
        'session.created': false,
      },
    };

    resolver = createEventResolver(configDisabled);

    const result = resolver.resolve('session.created', {}, {});
    expect(result.enabled).toBe(false);
  });

  it('resolves event with toast override', () => {
    const configWithToast: UserEventsConfig = {
      ...userConfig,
      events: {
        'session.created': {
          toast: {
            enabled: true,
            title: 'Custom Title',
            message: 'Custom message',
          },
        },
      },
    };

    resolver = createEventResolver(configWithToast);

    const result = resolver.resolve('session.created', {}, {});
    expect(result.toast).toBe(true);
  });

  it.skip('resolves event with scripts array', () => {
    const configWithScripts: UserEventsConfig = {
      ...userConfig,
      events: {
        'session.created': {
          scripts: [
            { source: 'native', path: 'hook1.sh' },
            { source: 'native', path: 'hook2.sh' },
          ],
        },
      },
    };

    resolver = createEventResolver(configWithScripts);

    const result = resolver.resolve('session.created', {}, {});
    expect(result.scripts).toHaveLength(2);
  });
});

describe('ToolConfigResolver integration', () => {
  let toolResolver: ToolConfigResolver;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('resolves tool without custom config', () => {
    toolResolver = createToolResolver(userConfig);

    const result = toolResolver.resolve('tool.execute.before', 'bash', {}, {});
    expect(result.enabled).toBe(true);
  });

  it.skip('resolves tool.execute.after', () => {
    toolResolver = createToolResolver(userConfig);

    const result = toolResolver.resolve('tool.execute.after', 'Bash', {}, {});
    expect(result.enabled).toBe(true);
  });

  it.skip('resolves tool with debug enabled', () => {
    const configWithDebug: UserEventsConfig = {
      ...userConfig,
      default: {
        debug: true,
      },
    };

    toolResolver = createToolResolver(configWithDebug);

    const result = toolResolver.resolve('tool.execute.before', 'bash', {}, {});
    expect(result.debug).toBe(true);
  });

  it.skip('resolves tool with logToAudit disabled', () => {
    const configNoAudit: UserEventsConfig = {
      ...userConfig,
      default: {
        logToAudit: false,
      },
    };

    toolResolver = createToolResolver(configNoAudit);

    const result = toolResolver.resolve('tool.execute.before', 'bash', {}, {});
    expect(result.logToAudit).toBe(false);
  });

  it('resolves tool with runScripts true in custom config', () => {
    const configWithScripts: UserEventsConfig = {
      ...userConfig,
      tools: {
        ...userConfig.tools,
        'tool.execute.before': {
          bash: {
            enabled: true,
            runScripts: true,
            scripts: [{ source: 'native', path: 'block.sh' }],
          },
        },
      },
    };

    toolResolver = createToolResolver(configWithScripts);

    const result = toolResolver.resolve('tool.execute.before', 'bash', {}, {});
    expect(result.runScripts).toBe(true);
    expect(result.scripts).toHaveLength(1);
  });
});

describe('createContext', () => {
  it.skip('creates context with provided handlers', () => {
    const context = createContext(userConfig, handlers);
    expect(context.enabled).toBe(true);
    expect(context.handlers).toBe(handlers);
  });

  it.skip('creates context with default handlers when not provided', () => {
    const context = createContext(userConfig);
    expect(context.enabled).toBe(true);
    expect(context.handlers).toBeDefined();
  });

  it.skip('returns event config via getEventConfig', () => {
    const context = createContext(userConfig);
    const config = context.getEventConfig('session.created');
    expect(config).toBeDefined();
  });

  it.skip('returns tool configs via getToolConfigs', () => {
    const context = createContext(userConfig);
    const config = context.getToolConfigs('tool.execute.before');
    expect(config).toBeDefined();
  });

  it.skip('returns scriptToasts from context', () => {
    const context = createContext(userConfig);
    expect(context.scriptToasts).toBeDefined();
  });

  it.skip('returns default config from context', () => {
    const context = createContext(userConfig);
    expect(context.default).toBeDefined();
  });
});
