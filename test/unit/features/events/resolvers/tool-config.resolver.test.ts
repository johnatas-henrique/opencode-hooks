import { describe, it, expect } from 'vitest';
import { ToolConfigResolverImpl } from '.opencode/plugins/features/events/resolvers/tool-config.resolver';
import { createContext } from '../../../helpers/create-context';
import { createHandler } from '../../../helpers/create-handler';

describe('ToolConfigResolverImpl', () => {
  it('returns disabled config when toolConfig is false', () => {
    const ctx = createContext({
      getToolConfigs: () => ({ bash: false }),
    });
    const resolver = new ToolConfigResolverImpl(ctx);
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
    const resolver = new ToolConfigResolverImpl(ctx);
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
    const resolver = new ToolConfigResolverImpl(ctx);
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
    const resolver = new ToolConfigResolverImpl(ctx);
    const result = resolver.resolve('tool.execute.after', 'bash');
    expect(result.toastTitle).toBe('Bash After');
  });

  it('returns empty toastTitle when no handler found', () => {
    const ctx = createContext({
      getToolConfigs: () => ({ bash: {} }),
    });
    const resolver = new ToolConfigResolverImpl(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.toastTitle).toBe('');
  });

  it('applies toolOverride block config', () => {
    const ctx = createContext({
      getToolConfigs: () => ({
        bash: {
          block: [{ check: () => true, message: 'custom block' }],
        },
      }),
    });
    const resolver = new ToolConfigResolverImpl(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.block).toHaveLength(1);
    expect(result.block[0].message).toBe('custom block');
  });

  it('merges claude scripts when runScripts is true', () => {
    const handler = createHandler({ defaultScript: 'handler.sh' });
    const ctx = createContext({
      handlers: { 'tool.execute.before': handler },
      getToolConfigs: () => ({ bash: { runScripts: true } }),
      claudeScripts: {
        'tool.execute.before': [
          { source: 'claude', path: 'claude.sh', matcher: 'bash' },
        ],
      },
    });
    const resolver = new ToolConfigResolverImpl(ctx);
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
    const resolver = new ToolConfigResolverImpl(ctx);
    const result = resolver.resolve('tool.execute.before', 'bash');
    expect(result.toastTitle).toBe('Tool Before');
  });
});
