import { defaultUserConfig } from '.opencode/plugins/config/defaults';
import { loadUserConfig } from '.opencode/plugins/config/jsonc-loader';

export const userConfig = loadUserConfig(defaultUserConfig);
