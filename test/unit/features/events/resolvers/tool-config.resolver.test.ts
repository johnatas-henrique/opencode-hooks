import { describe, it, expect } from 'vitest';
import { DefaultToolConfigResolver } from '.opencode/plugins/features/events/resolvers/tool-config.resolver';
import { createContext } from '../../../helpers/create-context';
import { createHandler } from '../../../helpers/create-handler';

describe('DefaultToolConfigResolver', () => {
  it('returns disabled config when toolConfig is false', () => {
    const ctx = createContext({
      getToolConfigs: () => ({ bash: false }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.enabled).toBe(false);
    expect(result.toast).toBe(false);
    expect(result.scripts).toEqual([]);
    expect(result.runScripts).toBe(false);
  });

  it('returns default config for empty object toolConfig', () => {
    const ctx = createContext({
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.enabled).toBe(true);
  });

  it('uses toolHandler when toolEventType has .before', () => {
    const toolHandler = createHandler({
      title: 'Bash Before',
      buildMessage: () => 'before message',
    });
    const ctx = createContext({
      handlers: { 'tool.execute.before.bash': toolHandler },
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash', {
      tool: 'bash',
    });
    expect(result.toastTitle).toBe('Bash Before');
    expect(result.toastMessage).toBe('before message');
  });

  it('uses toolHandler when toolEventType has .after', () => {
    const toolHandler = createHandler({
      title: 'Bash After',
    });
    const ctx = createContext({
      handlers: { 'tool.execute.after.bash': toolHandler },
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.after', 'bash');
    expect(result.toastTitle).toBe('Bash After');
  });

  it('returns empty toastTitle when no handler found', () => {
    const ctx = createContext({
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.toastTitle).toBe('');
  });

  it('merges claude scripts when runScripts is true', () => {
    const handler = createHandler({ defaultScript: 'handler.sh' });
    const ctx = createContext({
      handlers: { 'tool.execute.before': handler },
      getToolConfigs: () => ({ bash: { runScripts: true } }),
      getClaudeScripts: () => ({
        'tool.execute.before': [
          { source: 'claude', path: 'claude.sh', matcher: 'bash' },
        ],
      }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.scripts).toContainEqual({
      source: 'claude',
      path: 'claude.sh',
      matcher: 'bash',
    });
  });

  it('uses event handler when no toolHandler and toolEventType has handler', () => {
    const eventHandler = createHandler({ title: 'Tool Before' });
    const ctx = createContext({
      handlers: { 'tool.execute.before': eventHandler },
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.toastTitle).toBe('Tool Before');
  });

  it('returns empty toastTitle when getToolHandler returns undefined for invalid toolEventType', () => {
    const ctx = createContext({
      handlers: {},
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('invalid.type', 'bash');
    expect(result.toastTitle).toBe('');
  });

  it('applies claude scripts when toolConfig is empty and runScripts is true', () => {
    const ctx = createContext({
      getToolConfigs: () => ({ bash: {} }),
      default: { runScripts: true },
      getClaudeScripts: () => ({
        'tool.execute.before': [
          { source: 'claude', path: 'claude.sh', matcher: 'bash' },
        ],
      }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.scripts).toContainEqual({
      source: 'claude',
      path: 'claude.sh',
      matcher: 'bash',
    });
  });

  it('returns same config when applyClaudeScripts produces no merge', () => {
    const _ctx = createContext({
      getToolConfigs: () => ({ bash: {} }),
      default: { runScripts: true },
      getClaudeScripts: () => ({
        'tool.execute.before': [
          { source: 'claude', path: 'claude.sh', matcher: 'bash' },
        ],
      }),
    });
  });

  it('uses resolveBase when getEventConfig returns a value', () => {
    const handler = createHandler({ title: 'Tool Event' });
    const ctx = createContext({
      handlers: { 'tool.execute.before': handler },
      getEventConfig: () => ({ toast: true }),
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.toast).toBe(true);
    expect(result.enabled).toBe(true);
  });

  it('uses resolveBase with disabled event config', () => {
    const ctx = createContext({
      getEventConfig: () => false,
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.enabled).toBe(false);
  });

  it('uses resolveBase with scripts from handler', () => {
    const handler = createHandler({ defaultScript: 'myscript.sh' });
    const ctx = createContext({
      handlers: { 'tool.execute.before': handler },
      getEventConfig: () => ({ runScripts: true }),
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.runScripts).toBe(true);
    expect(result.scripts[0]?.path).toBe('myscript.sh');
  });

  it('handles handler whose buildMessage throws gracefully', () => {
    const handler = createHandler({
      buildMessage: () => {
        throw new Error('msg fail');
      },
    });
    const ctx = createContext({
      handlers: { 'tool.execute.before': handler },
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.toastMessage).toBe('');
  });

  it('uses handler.defaultScript in getDefaultConfig when runScripts is true on default', () => {
    const handler = createHandler({
      defaultScript: 'custom-handler.sh',
    });
    const ctx = createContext({
      handlers: { 'tool.execute.before': handler },
      default: { runScripts: true },
      getEventConfig: () => undefined,
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new DefaultToolConfigResolver(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.runScripts).toBe(true);
    expect(result.scripts[0]?.path).toBe('custom-handler.sh');
  });
});
