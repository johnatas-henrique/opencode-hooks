import type { ResolvedEventConfig } from '.opencode/plugins/types/config';
import type { ToastConfig } from '.opencode/plugins/types/toast';

export interface ScriptConstantsConfig {
  dir: string;
}

export interface CoreConstantsConfig {
  defaultSessionId: 'unknown';
  maxPromptLength: 10000;
  maxToastLength: 1000;
  tool: {
    TASK: 'task';
    SUBAGENT_TYPE_ARG: 'subagent_type';
  };
}

export interface AuditFileNamesConfig {
  events: 'plugin-events.json';
  scripts: 'plugin-scripts.json';
  errors: 'plugin-errors.json';
  security: 'plugin-security.json';
  debug: 'plugin-debug.json';
}

export interface DefaultsConfig {
  toast: ToastConfig;
  scripts: ScriptConstantsConfig;
  core: CoreConstantsConfig;
  audit: {
    files: AuditFileNamesConfig;
  };
  config: {
    disabled: ResolvedEventConfig;
  };
}
