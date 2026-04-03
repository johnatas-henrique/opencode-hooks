declare module '@opencode-ai/plugin' {
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
    $: any;
    project: string;
    directory: string;
    worktree: string;
    serverUrl: string;
  }

  export type Plugin = (
    ctx: PluginInput
  ) => Promise<Record<string, (...args: any[]) => Promise<void>>>;
}

declare module '@opencode-ai/sdk' {
  export interface Event {
    type: string;
    properties: Record<string, unknown>;
  }

  export interface EventSessionCreated extends Event {
    type: 'session.created';
    properties: { info: { id: string; title: string } };
  }

  export interface EventSessionCompacted extends Event {
    type: 'session.compacted';
    properties: { sessionID: string };
  }

  export interface EventSessionDeleted extends Event {
    type: 'session.deleted';
    properties: { info: { id: string } };
  }

  export interface EventSessionError extends Event {
    type: 'session.error';
    properties: {
      sessionID: string;
      error?: { name: string; data?: { message: string } };
    };
  }

  export interface EventSessionDiff extends Event {
    type: 'session.diff';
    properties: { sessionID: string; diff: Array<Record<string, unknown>> };
  }

  export interface EventSessionIdle extends Event {
    type: 'session.idle';
    properties: { sessionID: string };
  }

  export interface EventSessionStatus extends Event {
    type: 'session.status';
    properties: { sessionID: string; status: Record<string, unknown> };
  }

  export interface EventSessionUpdated extends Event {
    type: 'session.updated';
    properties: { info: { id: string } };
  }
}

declare module '@opentui/core' {
  export type ToastVariant = 'success' | 'warning' | 'error' | 'info';
}

declare module '@opentui/solid' {
  export type Component = unknown;
}
