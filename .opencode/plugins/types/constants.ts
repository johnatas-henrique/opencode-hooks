import type { ResolvedEventConfig } from './config';
import type { ToastConfig } from './toast';

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
    archiveDir: 'audit-archive';
  };
  config: {
    disabled: ResolvedEventConfig;
  };
}
