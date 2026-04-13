export type PluginInput = {
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
};

export type PluginOptions = Record<string, unknown>;

export type Plugin = (
  input: PluginInput,
  options?: PluginOptions
) => Promise<Record<string, unknown>>;
