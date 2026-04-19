import type { PluginInput } from '@opencode-ai/plugin';
import type { Mock } from 'vitest';

export type PluginClient = {
  tui: {
    showToast: Mock;
  };
  session: {
    prompt: Mock;
  };
};

export type PluginDollar = Mock;

export type MockPluginInput = Omit<
  PluginInput,
  'client' | '$' | 'serverUrl' | 'project' | 'experimental_workspace'
> & {
  client: PluginClient;
  $: PluginDollar;
  serverUrl: string;
  project: string;
  experimental_workspace: {
    register: Mock;
  };
};

export function createMockPluginInput(
  options: Partial<MockPluginInput> = {}
): MockPluginInput {
  return {
    client: {
      tui: {
        showToast: vi.fn(),
      },
      session: {
        prompt: vi.fn(),
      },
    },
    $: vi.fn(),
    project: 'test-project',
    directory: '/test/dir',
    worktree: '/test/dir',
    serverUrl: 'http://localhost:3000',
    experimental_workspace: {
      register: vi.fn(),
    },
    ...options,
  };
}

export type { PluginInput };
