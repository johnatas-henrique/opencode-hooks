import type { PluginInput } from '@opencode-ai/plugin';
import type { ResolvedEventConfig } from './event-types';

export interface RunScriptConfig {
  ctx: PluginInput;
  script: string;
  scriptArg?: string;
  toolName?: string;
  timestamp: string;
  eventType: string;
  resolved: ResolvedEventConfig;
  sessionId: string;
}
