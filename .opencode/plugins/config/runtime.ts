import fs from 'fs';
import path from 'path';
import { defaultUserConfig } from '.opencode/plugins/config/defaults';
import {
  loadUserConfig,
  getConfigPaths,
} from '.opencode/plugins/config/jsonc-loader';
import type { UserEventsConfig } from '.opencode/plugins/types/config';

const SCHEMA_URL =
  'https://raw.githubusercontent.com/johnatas-henrique/opencode-hooks/main/assets/opencode-hooks.schema.json';

export function hasAnyConfigFile(): boolean {
  const paths = getConfigPaths();
  return fs.existsSync(paths.projectPath) || fs.existsSync(paths.globalPath);
}

export function writeDefaultConfig(
  projectPath: string,
  config: UserEventsConfig
): void {
  const dir = path.dirname(projectPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const minimal = {
    $schema: SCHEMA_URL,
    enabled: config.enabled,
    loadClaudeHookSettings: config.loadClaudeHookSettings,
  };
  const body = JSON.stringify(minimal, null, 2);
  fs.writeFileSync(projectPath, body, 'utf-8');
}

export const userConfig = ((): UserEventsConfig => {
  const config = loadUserConfig(defaultUserConfig);

  if (!hasAnyConfigFile()) {
    const paths = getConfigPaths();
    writeDefaultConfig(paths.projectPath, config);
  }

  return config;
})();
