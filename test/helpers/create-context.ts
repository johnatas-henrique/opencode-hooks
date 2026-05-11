import type {
  EventHandler,
  ConfigResolverContext,
} from '.opencode/plugins/types/events';
import type { EventVariant, ToolConfig } from '.opencode/plugins/types/config';
import type { EventOverride } from '.opencode/plugins/types/config';
import type { ScriptEntry } from '.opencode/plugins/types/config';

export interface CreateContextOptions {
  enabled?: boolean;
  default?: EventOverride;
  handlers?: Record<string, EventHandler>;
  getEventConfig?: (eventType: string) => unknown;
  getToolConfigs?: (
    toolEventType: string
  ) => Record<string, unknown> | undefined;
  getClaudeScripts?: (_projectDir: string) => Record<string, ScriptEntry[]>;
  getProjectDir?: () => string;
  scriptToasts?: {
    showOutput: boolean;
    showError: boolean;
    outputVariant: EventVariant;
    errorVariant: EventVariant;
    outputDuration: number;
    errorDuration: number;
    outputTitle: string;
    errorTitle: string;
  };
}

export function createContext(
  options: CreateContextOptions = {}
): ConfigResolverContext {
  const defaults: EventOverride = {
    toast: false,
    runScripts: false,
    runOnlyOnce: false,
    logToAudit: true,
    appendToSession: false,
  };
  const provided = options.default ?? {};

  return {
    enabled: options.enabled ?? true,
    default: { ...defaults, ...provided },
    handlers: options.handlers ?? {},
    getEventConfig: (eventType: string) =>
      options.getEventConfig?.(eventType) as
        | Record<string, unknown>
        | undefined,
    getToolConfigs: (toolEventType: string) =>
      options.getToolConfigs?.(toolEventType) as
        | Record<string, ToolConfig>
        | undefined,
    getClaudeScripts:
      options.getClaudeScripts ?? ((_projectDir: string) => ({})),
    getProjectDir: options.getProjectDir ?? (() => '/tmp/test'),
    scriptToasts: options.scriptToasts ?? {
      showOutput: true,
      showError: true,
      outputVariant: 'info' as const,
      errorVariant: 'error' as const,
      outputDuration: 5000,
      errorDuration: 15000,
      outputTitle: 'Script Output',
      errorTitle: 'Script Error',
    },
  };
}
