import { describe, it, expect } from 'vitest';
import { EventType } from '.opencode/plugins/types/events';
import { withEvent, withToolEvent } from 'test/helpers/create-config';

describe('withEvent', () => {
  it('should create partial config with empty event object', () => {
    const partial = withEvent('session.created', {});
    expect(partial.events?.['session.created']).toEqual({});
  });
});

describe('withToolEvent', () => {
  it('should not affect other tools when creating partial config', () => {
    const partial = withToolEvent(EventType.TOOL_EXECUTE_BEFORE, 'bash', {
      debug: true,
    });
    expect(
      partial.tools?.[EventType.TOOL_EXECUTE_BEFORE]?.grep
    ).toBeUndefined();
  });
});
