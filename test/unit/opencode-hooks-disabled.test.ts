import type { PluginInput } from '@opencode-ai/plugin';
import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';

import type { MockPluginInput } from '../__mocks__/@opencode-ai/plugin';
import { createMockPluginInput } from '../__mocks__/@opencode-ai/plugin';
import { vi, beforeEach, describe, it, expect } from 'vitest';

const mockClient = {
  tui: {
    showToast: vi.fn().mockResolvedValue(undefined),
  },
  session: {
    prompt: vi.fn().mockResolvedValue(undefined),
  },
};

function createMockCtx(overrides: Partial<MockPluginInput> = {}): PluginInput {
  const mock = createMockPluginInput({
    client: mockClient,
    $: vi.fn<
      () => Promise<{ exitCode: number; stdout: string; stderr: string }>
    >(),
    ...overrides,
  });
  return mock as unknown as PluginInput;
}

// Mock with enabled: false
vi.mock('../../.opencode/plugins/config/settings', () => ({
  userConfig: {
    enabled: false,
    audit: {
      enabled: true,
      level: 'debug',
      basePath: '/tmp/audit-test',
      maxSizeMB: 1,
      maxAgeDays: 30,
      logTruncationKB: 0.5,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [],
    },
  },
}));

vi.mock('../../.opencode/plugins/features/messages/default-handlers', () => ({
  handlers: {},
}));

vi.mock('../../.opencode/plugins/features/audit/plugin-integration', () => ({
  archiveAllJsonFiles: vi.fn().mockResolvedValue(undefined),
  initAuditLogging: vi.fn().mockResolvedValue(undefined),
  getEventRecorder: vi.fn().mockReturnValue(null),
  getScriptRecorder: vi.fn().mockReturnValue(null),
  createAuditLogger: vi.fn().mockReturnValue({
    writeLine: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('opencode-hooks-disabled - line 197 coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty object when userConfig.enabled is false (line 197)', async () => {
    const ctx = createMockCtx();
    const plugin = await OpencodeHooks(ctx);

    // When disabled, OpencodeHooks returns {}
    expect(plugin).toEqual({});
  });

  it('should not have event property when disabled', async () => {
    const ctx = createMockCtx();
    const plugin = await OpencodeHooks(ctx);

    expect(plugin).not.toHaveProperty('event');
  });
});
