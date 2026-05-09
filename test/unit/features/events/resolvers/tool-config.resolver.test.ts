import { describe, it, expect } from 'vitest';
import { DefaultToolConfigResolver } from '.opencode/plugins/features/events/resolvers/tool-config.resolver';
import { createContext } from '../../../helpers/create-context';
import { createHandler } from '../../../helpers/create-handler';
import { expectDefaults } from '../../../helpers/config-assertions';

function resolveToolConfig(
  overrides: Parameters<typeof createContext>[0] = {},
  eventType = 'tool.execute.before',
  toolName = 'bash',
  input?: Record<string, unknown>
) {
  const ctx = createContext(overrides);
  const resolver = new DefaultToolConfigResolver(ctx);
  return resolver.resolve(eventType, toolName, input);
}

describe('DefaultToolConfigResolver', () => {
  it('returns disabled config when toolConfig is false', () => {
    const result = resolveToolConfig({
      getToolConfigs: () => ({ bash: false }),
    });
    expectDefaults(result);
  });

  it('returns default config for empty object toolConfig', () => {
    const result = resolveToolConfig({
      getToolConfigs: () => ({ bash: {} }),
    });
    expect(result.enabled).toBe(true);
  });

  it('uses toolHandler when toolEventType has .before', () => {
    const toolHandler = createHandler({
      title: 'Bash Before',
      buildMessage: () => 'before message',
    });
    const result = resolveToolConfig(
      {
        handlers: { 'tool.execute.before.bash': toolHandler },
        getToolConfigs: () => ({ bash: {} }),
      },
      'tool.execute.before',
      'bash',
      { tool: 'bash' }
    );
    expect(result.toastTitle).toBe('Bash Before');
    expect(result.toastMessage).toBe('before message');
  });

  it('uses toolHandler when toolEventType has .after', () => {
    const toolHandler = createHandler({
      title: 'Bash After',
    });
    const result = resolveToolConfig(
      {
        handlers: { 'tool.execute.after.bash': toolHandler },
        getToolConfigs: () => ({ bash: {} }),
      },
      'tool.execute.after'
    );
    expect(result.toastTitle).toBe('Bash After');
  });

  it('returns empty toastTitle when no handler found', () => {
    const result = resolveToolConfig({
      getToolConfigs: () => ({ bash: {} }),
    });
    expect(result.toastTitle).toBe('');
  });

  it('merges claude scripts when runScripts is true', () => {
    const handler = createHandler({ defaultScript: 'handler.sh' });
    const result = resolveToolConfig({
      handlers: { 'tool.execute.before': handler },
      getToolConfigs: () => ({ bash: { runScripts: true } }),
      getClaudeScripts: () => ({
        'tool.execute.before': [
          { source: 'claude', path: 'claude.sh', matcher: 'bash' },
        ],
      }),
    });
    expect(result.scripts).toContainEqual({
      source: 'claude',
      path: 'claude.sh',
      matcher: 'bash',
    });
  });

  it('uses event handler when no toolHandler and toolEventType has handler', () => {
    const eventHandler = createHandler({ title: 'Tool Before' });
    const result = resolveToolConfig({
      handlers: { 'tool.execute.before': eventHandler },
      getToolConfigs: () => ({ bash: {} }),
    });
    expect(result.toastTitle).toBe('Tool Before');
  });

  it('returns empty toastTitle when getToolHandler returns undefined for invalid toolEventType', () => {
    const result = resolveToolConfig(
      {
        handlers: {},
        getToolConfigs: () => ({ bash: {} }),
      },
      'invalid.type'
    );
    expect(result.toastTitle).toBe('');
  });

  it('applies claude scripts when toolConfig is empty and runScripts is true', () => {
    const result = resolveToolConfig({
      getToolConfigs: () => ({ bash: {} }),
      default: { runScripts: true },
      getClaudeScripts: () => ({
        'tool.execute.before': [
          { source: 'claude', path: 'claude.sh', matcher: 'bash' },
        ],
      }),
    });
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
    const result = resolveToolConfig({
      handlers: { 'tool.execute.before': handler },
      getEventConfig: () => ({ toast: true }),
      getToolConfigs: () => ({ bash: {} }),
    });
    expect(result.toast).toBe(true);
    expect(result.enabled).toBe(true);
  });

  it('uses resolveBase with disabled event config', () => {
    const result = resolveToolConfig({
      getEventConfig: () => false,
      getToolConfigs: () => ({ bash: {} }),
    });
    expect(result.enabled).toBe(false);
  });

  it('uses resolveBase with scripts from handler', () => {
    const handler = createHandler({ defaultScript: 'myscript.sh' });
    const result = resolveToolConfig({
      handlers: { 'tool.execute.before': handler },
      getEventConfig: () => ({ runScripts: true }),
      getToolConfigs: () => ({ bash: {} }),
    });
    expect(result.runScripts).toBe(true);
    expect(result.scripts[0]?.path).toBe('myscript.sh');
  });

  it('handles handler whose buildMessage throws gracefully', () => {
    const handler = createHandler({
      buildMessage: () => {
        throw new Error('msg fail');
      },
    });
    const result = resolveToolConfig({
      handlers: { 'tool.execute.before': handler },
      getToolConfigs: () => ({ bash: {} }),
    });
    expect(result.toastMessage).toBe('');
  });

  it('uses handler.defaultScript in getDefaultConfig when runScripts is true on default', () => {
    const handler = createHandler({
      defaultScript: 'custom-handler.sh',
    });
    const result = resolveToolConfig({
      handlers: { 'tool.execute.before': handler },
      default: { runScripts: true },
      getEventConfig: () => undefined,
      getToolConfigs: () => ({ bash: {} }),
    });
    expect(result.runScripts).toBe(true);
    expect(result.scripts[0]?.path).toBe('custom-handler.sh');
  });
});
