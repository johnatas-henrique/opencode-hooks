export interface ToastInput {
  body: {
    title: string;
    message: string;
    variant: 'success' | 'error' | 'warning' | 'info';
    duration: number;
  };
}

export interface SessionPromptInput {
  path: { id: string };
  body: {
    noReply: boolean;
    parts: Array<{ type: string; text: string }>;
  };
}

export interface PluginClient {
  tui: {
    showToast: (toast: ToastInput) => Promise<void>;
  };
  session: {
    prompt: (args: SessionPromptInput) => Promise<void>;
  };
}

export type PluginDollar = (
  strings: TemplateStringsArray,
  ...args: string[]
) => Promise<{ exitCode: number; stdout: string; stderr: string }>;

export interface PluginInput {
  client: PluginClient;
  $: PluginDollar;
  project: string;
  directory: string;
  worktree: string;
  serverUrl: string;
}

export type Plugin = (ctx: PluginInput) => Promise<Record<string, unknown>>;

// Helper types for mocks
export interface MockCreateCtxOptions {
  client?: Partial<PluginClient>;
  $?: PluginDollar;
  project?: string;
  directory?: string;
  worktree?: string;
  serverUrl?: string;
}

export function createMockPluginInput(
  options: MockCreateCtxOptions = {}
): PluginInput {
  return {
    client: {
      tui: {
        showToast: vi.fn().mockResolvedValue(undefined),
      },
      session: {
        prompt: vi.fn().mockResolvedValue(undefined),
      },
      ...options.client,
    },
    $: options.$ ?? (vi.fn() as PluginDollar),
    project: options.project ?? 'test-project',
    directory: options.directory ?? '/test/dir',
    worktree: options.worktree ?? '/test/dir',
    serverUrl: options.serverUrl ?? 'http://localhost:3000',
  };
}
