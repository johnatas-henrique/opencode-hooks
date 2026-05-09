import type {
  EventHandler,
  ConfigResolverContext,
} from '.opencode/plugins/types/events';
import type { ToolConfig } from '.opencode/plugins/types/config';
import type { EventOverride } from '.opencode/plugins/types/config';
import type { ScriptEntry } from '.opencode/plugins/types/config';
import { createDefaultEventOverride } from './test-defaults';

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
    outputVariant: 'success' | 'warning' | 'error' | 'info';
    errorVariant: 'success' | 'warning' | 'error' | 'info';
    outputDuration: number;
    errorDuration: number;
    outputTitle: string;
    errorTitle: string;
  };
}

export function createContext(
  options: CreateContextOptions = {}
): ConfigResolverContext {
  const defaults = createDefaultEventOverride();
  const provided = options.default ?? {};

  return {
    enabled: options.enabled ?? true,
    default: { ...defaults, ...provided },
    handlers: options.handlers ?? {},
    onUnknownEvent: () => {},
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
