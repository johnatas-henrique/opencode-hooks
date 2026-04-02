export type PluginInput = {
  client: any;
  project: any;
  directory: string;
  worktree: string;
  serverUrl: URL;
  $: any;
};

export type PluginOptions = Record<string, unknown>;

export type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<any>;
