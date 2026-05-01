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
  events: 'plugin-events_{session}.json';
  scripts: 'plugin-scripts_{session}.json';
  errors: 'plugin-errors_{session}.json';
  security: 'plugin-security_{session}.json';
  debug: 'plugin-debug_{session}.json';
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
