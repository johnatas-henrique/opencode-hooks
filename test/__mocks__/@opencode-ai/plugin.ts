export interface PluginInput {
  client: {
    tui: {
      showToast: (toast: {
        body: {
          title: string;
          message: string;
          variant: string;
          duration: number;
        };
      }) => Promise<void>;
    };
    session: {
      prompt: (args: {
        path: { id: string };
        body: {
          noReply: boolean;
          parts: Array<{ type: string; text: string }>;
        };
      }) => Promise<void>;
    };
  };
  $: (
    strings: TemplateStringsArray,
    ...args: string[]
  ) => Promise<{ exitCode: number; stdout: string; stderr: string }>;
  project: string;
  directory: string;
  worktree: string;
  serverUrl: string;
}

export type Plugin = (ctx: PluginInput) => Promise<Record<string, unknown>>;
