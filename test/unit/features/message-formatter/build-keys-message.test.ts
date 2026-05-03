import { describe, it, expect, vi } from 'vitest';
import {
  buildKeysMessage,
  buildKeysMessageSimple,
} from '.opencode/plugins/features/message-formatter/build-keys-message';
import type { BuildKeysEvent } from '.opencode/plugins/types/messages';

describe('buildKeysMessage', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-01-15T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds message from input.args when no allowedFields', () => {
    const event: BuildKeysEvent = {
      input: { args: { command: 'ls', path: '/tmp' } },
    };
    const result = buildKeysMessage(event);
    expect(result).toContain('input.args.command:');
    expect(result).toContain('input.args.path:');
    expect(result).toContain('Time:');
  });

  it('builds message from input fields other than args', () => {
    const event: BuildKeysEvent = {
      input: { tool: 'bash', sessionID: 'ses_123' },
    };
    const result = buildKeysMessage(event);
    expect(result).toContain('input.tool');
    expect(result).toContain('input.sessionID');
  });

  it('builds message from output when no allowedFields', () => {
    const event: BuildKeysEvent = {
      output: { status: 'success', exitCode: 0 },
    };
    const result = buildKeysMessage(event);
    expect(result).toContain('output.status');
    expect(result).toContain('output.exitCode');
  });

  it('uses allowedFields with input. prefix', () => {
    const event: BuildKeysEvent = {
      input: { tool: 'bash', sessionID: 'ses_123' },
      output: { status: 'success' },
    };
    const result = buildKeysMessage(event, ['input.tool', 'output.status']);
    expect(result).toContain('input.tool');
    expect(result).toContain('output.status');
    expect(result).not.toContain('input.sessionID');
  });

  it('uses allowedFields with properties. prefix', () => {
    const event: BuildKeysEvent = {
      properties: { file: 'test.ts', action: 'write' },
    };
    const result = buildKeysMessage(event, ['properties.file']);
    expect(result).toContain('properties.file');
    expect(result).not.toContain('properties.action');
  });

  it('allows bare field name without prefix, searching input/output/properties', () => {
    const event: BuildKeysEvent = {
      input: { tool: 'bash' },
      output: { status: 'done' },
    };
    const result = buildKeysMessage(event, ['tool']);
    expect(result).toContain('tool');
  });

  it('skips undefined values from allowedFields', () => {
    const event: BuildKeysEvent = {
      input: { tool: 'bash' },
    };
    const result = buildKeysMessage(event, ['input.tool', 'output.status']);
    expect(result).toContain('input.tool');
    expect(result).not.toContain('output.status');
  });

  it('falls back to event.properties when no lines from input/output', () => {
    const event: BuildKeysEvent = {
      properties: { reason: 'test fallback', count: 3 },
    };
    const result = buildKeysMessage(event);
    expect(result).toContain('reason');
    expect(result).toContain('count');
  });

  it('appends Time at the end', () => {
    const event: BuildKeysEvent = { input: { tool: 'bash' } };
    const result = buildKeysMessage(event);
    const lines = result.split('\n');
    expect(lines[lines.length - 1]).toMatch(/^Time:/);
  });

  it('serializes object properties as JSON', () => {
    const event: BuildKeysEvent = {
      properties: { metadata: { key: 'val' } },
    };
    const result = buildKeysMessage(event);
    expect(result).toContain('metadata:');
    expect(result).toContain('key');
    expect(result).toContain('val');
  });
});

describe('buildKeysMessageSimple', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-01-15T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flattens properties when no allowedFields', () => {
    const event: BuildKeysEvent = {
      properties: { name: 'test', value: 42 },
    };
    const result = buildKeysMessageSimple(event);
    expect(result).toContain('name:');
    expect(result).toContain('value:');
  });

  it('recursively flattens nested objects', () => {
    const event: BuildKeysEvent = {
      properties: { outer: { inner: 'deep', count: 1 } },
    };
    const result = buildKeysMessageSimple(event);
    expect(result).toContain('outer.inner:');
    expect(result).toContain('outer.count:');
  });

  it('handles array values without recursion', () => {
    const event: BuildKeysEvent = {
      properties: { items: [1, 2, 3] },
    };
    const result = buildKeysMessageSimple(event);
    expect(result).toContain('items:');
  });

  it('uses allowedFields to filter', () => {
    const event: BuildKeysEvent = {
      properties: { name: 'test', value: 42, extra: 'hidden' },
    };
    const result = buildKeysMessageSimple(event, ['name', 'value']);
    expect(result).toContain('name:');
    expect(result).toContain('value:');
    expect(result).not.toContain('extra');
  });

  it('skips undefined allowedFields', () => {
    const event: BuildKeysEvent = {
      properties: { name: 'test' },
    };
    const result = buildKeysMessageSimple(event, ['missing']);
    expect(result).not.toContain('missing');
  });

  it('returns only Time when no properties and no allowedFields', () => {
    const event: BuildKeysEvent = {};
    const result = buildKeysMessageSimple(event);
    expect(result).toMatch(/^Time:/);
  });

  it('appends Time at the end', () => {
    const event: BuildKeysEvent = { properties: { x: 1 } };
    const result = buildKeysMessageSimple(event);
    const lines = result.split('\n');
    expect(lines[lines.length - 1]).toMatch(/^Time:/);
  });
});
