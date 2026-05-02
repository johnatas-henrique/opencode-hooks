import type { PluginInput } from '@opencode-ai/plugin';
import type { MockPluginInput } from 'test/__mocks__/@opencode-ai/plugin';
import { createMockPluginInput } from 'test/__mocks__/@opencode-ai/plugin';
import { vi } from 'vitest';

export const mockClient = {
  tui: {
    showToast: vi.fn().mockResolvedValue(undefined),
  },
  session: {
    prompt: vi.fn().mockResolvedValue(undefined),
  },
};

export const mockDollar =
  vi.fn<() => Promise<{ exitCode: number; stdout: string; stderr: string }>>();

export function createMockCtx(
  overrides: Partial<MockPluginInput> = {}
): PluginInput {
  const mock = createMockPluginInput({
    client: mockClient,
    $: mockDollar,
    ...overrides,
  });
  return mock as unknown as PluginInput;
}
