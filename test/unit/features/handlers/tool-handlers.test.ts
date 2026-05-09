import { describe, it, expect } from 'vitest';
import { toolHandlers } from '.opencode/plugins/features/handlers/tool-handlers';
import { expectHandlerProps } from '../../helpers/handler-assertions';

function assertBaseHandler(
  h: {
    title: string;
    variant: string;
    duration: number;
    defaultScript: string;
  },
  expected: { title: string; defaultScript: string }
) {
  expect(h.title).toBe(expected.title);
  expect(h.variant).toBe('info');
  expect(h.duration).toBe(5000);
  expect(h.defaultScript).toBe(expected.defaultScript);
}

describe('toolHandlers', () => {
  const expectedKeys = [
    'tool.execute.before',
    'tool.execute.after',
    'tool.execute.after.subagent',
    'file.edited',
    'file.watcher.updated',
    'permission.asked',
    'permission.updated',
    'permission.replied',
  ] as const;

  it('contains all expected keys', () => {
    for (const key of expectedKeys) {
      expect(toolHandlers).toHaveProperty(key);
    }
    expect(Object.keys(toolHandlers).length).toBe(expectedKeys.length);
  });

  it('each handler has required properties', () => {
    expectHandlerProps(toolHandlers, expectedKeys);
  });

  it('tool.execute.before uses buildKeysMessage and has allowedFields', () => {
    const h = toolHandlers['tool.execute.before'];
    assertBaseHandler(h, {
      title: '====TOOL EXECUTE BEFORE====',
      defaultScript: 'tool-execute-before.sh',
    });
    expect(h.allowedFields).toEqual([
      'tool',
      'args.command',
      'args.filePath',
      'args.description',
    ]);
  });

  it('tool.execute.after uses buildKeysMessage with allowedFields and defaultTemplate', () => {
    const h = toolHandlers['tool.execute.after'];
    assertBaseHandler(h, {
      title: '====TOOL EXECUTE AFTER====',
      defaultScript: 'tool-execute-after.sh',
    });
    expect(h.allowedFields).toEqual([
      'tool',
      'output.title',
      'metadata.exit',
      'metadata.description',
    ]);
    expect(h.defaultTemplate).toBe(
      '[{timestamp}] {input.tool} → {output.metadata.exit}'
    );
  });

  it('tool.execute.after.subagent uses buildKeysMessage with subagentType', () => {
    const h = toolHandlers['tool.execute.after.subagent'];
    assertBaseHandler(h, {
      title: '====TOOL EXECUTE AFTER====',
      defaultScript: 'tool-execute-after.subagent.sh',
    });
    expect(h.allowedFields).toEqual(['tool', 'subagentType', 'output.title']);
    expect(h.defaultTemplate).toBe(
      '[{timestamp}] Subagent: {input.subagentType}'
    );
  });

  it('file.edited and file.watcher.updated use buildKeysMessageSimple', () => {
    for (const key of ['file.edited', 'file.watcher.updated'] as const) {
      const h = toolHandlers[key];
      expect(h.allowedFields).toEqual(['path']);
      expect(h.duration).toBe(5000);
    }
  });

  it('permission handlers have warning variant', () => {
    for (const key of [
      'permission.asked',
      'permission.updated',
      'permission.replied',
    ] as const) {
      const h = toolHandlers[key];
      expect(h.variant).toBe('warning');
      expect(h.duration).toBe(5000);
    }
  });

  it('permission.asked has allowedFields', () => {
    const h = toolHandlers['permission.asked'];
    expect(h.allowedFields).toEqual([
      'sessionID',
      'tool',
      'type',
      'pattern',
      'title',
    ]);
  });
});
