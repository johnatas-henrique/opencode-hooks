export interface PluginStatus {
  name: string;
  status: 'active' | 'failed' | 'incompatible';
  error?: string;
  source?: 'built-in' | 'user';
}

export interface PluginEntry {
  level: string;
  message: string;
  name?: string;
  path?: string;
  pkg?: string;
  error?: string;
}
