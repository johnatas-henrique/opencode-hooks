import { describe, it, expect } from 'vitest';
import { EventType } from '../../.opencode/plugins/types/config';
import { createUserConfig, withEvent, withToolEvent } from './create-config';

describe('createuserConfig', () => {
  it('should create base config when no overrides provided', () => {
    const config = createUserConfig();
    expect(config.enabled).toBe(true);
    expect(config.default.toast).toBe(true);
    expect(config.events).toEqual({});
  });

  it('should enable logDisabledEvents when override provided', () => {
    const config = createUserConfig({ logDisabledEvents: true });
    expect(config.logDisabledEvents).toBe(true);
  });

  it('should disable toast in default when override provided', () => {
    const config = createUserConfig({ default: { toast: false } });
    expect(config.default.toast).toBe(false);
  });

  it('should add event config when override provided', () => {
    const eventConfig = { debug: true, toast: true };
    const config = createUserConfig({
      events: { 'tool.execute.before': eventConfig },
    });
    expect(config.events['tool.execute.before']).toEqual(eventConfig);
  });

  it('should override tool configs when provided', () => {
    const toolConfig = { debug: true, toast: true };
    const config = createUserConfig({
      tools: {
        [EventType.TOOL_EXECUTE_BEFORE]: { bash: toolConfig },
      },
    });
    expect(config.tools[EventType.TOOL_EXECUTE_BEFORE]?.bash).toEqual(
      toolConfig
    );
  });

  it('should merge multiple overrides correctly', () => {
    const config = createUserConfig({
      logDisabledEvents: true,
      default: { toast: false, runScripts: true },
      events: { 'session.created': { debug: true } },
    });
    expect(config.logDisabledEvents).toBe(true);
    expect(config.default.toast).toBe(false);
    expect(config.default.runScripts).toBe(true);
    expect(config.events['session.created']?.debug).toBe(true);
  });
});

describe('withEvent', () => {
  it('should create partial config with event override', () => {
    const partial = withEvent('tool.execute.before', {
      debug: true,
      toast: true,
    });
    expect(partial.events?.['tool.execute.before']).toEqual({
      debug: true,
      toast: true,
    });
  });

  it('should create partial config with empty event object', () => {
    const partial = withEvent('session.created', {});
    expect(partial.events?.['session.created']).toEqual({});
  });
});

describe('withToolEvent', () => {
  it('should create partial config with tool-specific event override', () => {
    const partial = withToolEvent(EventType.TOOL_EXECUTE_BEFORE, 'bash', {
      debug: true,
    });
    expect(partial.tools?.[EventType.TOOL_EXECUTE_BEFORE]?.bash).toEqual({
      debug: true,
    });
  });

  it('should include all default tool event types', () => {
    const partial = withToolEvent(EventType.TOOL_EXECUTE_BEFORE, 'bash', {});
    expect(partial.tools).toHaveProperty(EventType.TOOL_EXECUTE_AFTER);
    expect(partial.tools).toHaveProperty(EventType.TOOL_EXECUTE_AFTER_SUBAGENT);
    expect(partial.tools).toHaveProperty(EventType.TOOL_EXECUTE_BEFORE);
  });

  it('should create partial config for specific tool', () => {
    const partial = withToolEvent(EventType.TOOL_EXECUTE_BEFORE, 'bash', {
      debug: true,
      toast: true,
    });
    expect(partial.tools?.[EventType.TOOL_EXECUTE_BEFORE]?.bash).toEqual({
      debug: true,
      toast: true,
    });
  });

  it('should not affect other tools when creating partial config', () => {
    const partial = withToolEvent(EventType.TOOL_EXECUTE_BEFORE, 'bash', {
      debug: true,
    });
    expect(
      partial.tools?.[EventType.TOOL_EXECUTE_BEFORE]?.grep
    ).toBeUndefined();
  });
});
