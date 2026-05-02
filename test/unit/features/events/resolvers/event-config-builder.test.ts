import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEventResolver,
  createToolResolver,
} from '.opencode/plugins/features/events/context';
import { userConfig } from '.opencode/plugins/config/settings';
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
});

describe('ToolConfigResolver integration', () => {
  let toolResolver: ToolConfigResolver;

  beforeEach(() => {
    vi.clearAllMocks();
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
