import type { PluginInput } from '@opencode-ai/plugin';
import { vi } from 'vitest';

export interface MockClient {
  tui: {
    showToast: ReturnType<typeof vi.fn>;
  };
  session: {
    prompt: ReturnType<typeof vi.fn>;
  };
}

export const createMockClient = (): MockClient => ({
  tui: {
    showToast: vi.fn().mockResolvedValue(undefined),
  },
  session: {
    prompt: vi.fn().mockResolvedValue(undefined),
  },
});

export function createMockCtx(
  client: MockClient,
  dollar: () => Promise<{ exitCode: number; stdout: string; stderr: string }>
): PluginInput {
  return {
    client: client as unknown as PluginInput['client'],
    $: dollar as unknown as PluginInput['$'],
    project: 'test-project' as unknown as PluginInput['project'],
    directory: '/test/dir' as unknown as PluginInput['directory'],
    worktree: '/test/dir' as unknown as PluginInput['worktree'],
    serverUrl: 'http://localhost:3000' as unknown as PluginInput['serverUrl'],
    experimental_workspace: {
      register: vi.fn(),
    } as unknown as PluginInput['experimental_workspace'],
  };
}

export function createMockDollar(): () => Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return vi
    .fn<() => Promise<{ exitCode: number; stdout: string; stderr: string }>>()
    .mockResolvedValue({
      exitCode: 0,
      stdout: '',
      stderr: '',
    });
}
