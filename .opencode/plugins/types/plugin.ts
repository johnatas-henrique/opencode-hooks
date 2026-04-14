export interface PluginStatus {
  name: string;
  status: 'active' | 'failed' | 'incompatible';
  error?: string;
  source?: 'built-in' | 'user';
}
