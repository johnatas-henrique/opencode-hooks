import { describe, it, expect } from 'vitest';
import { messageHandlers } from '.opencode/plugins/features/handlers/message-handlers';
import { expectHandlerProps } from '../../../helpers/handler-assertions';

describe('messageHandlers', () => {
  const expectedKeys = [
    'message.part.removed',
    'message.part.updated',
    'message.part.delta',
    'message.removed',
    'message.updated',
  ] as const;

  it('contains all expected keys', () => {
    for (const key of expectedKeys) {
      expect(messageHandlers).toHaveProperty(key);
    }
    expect(Object.keys(messageHandlers).length).toBe(expectedKeys.length);
  });

  it('each handler has required properties', () => {
    expectHandlerProps(messageHandlers, expectedKeys);
  });

  it('message.part.removed is warning variant', () => {
    const h = messageHandlers['message.part.removed'];
    expect(h.title).toBe('====MESSAGE PART REMOVED====');
    expect(h.variant).toBe('warning');
    expect(h.duration).toBe(5000);
    expect(h.defaultScript).toBe('message-part-removed.sh');
  });

  it('message.part.updated is info variant', () => {
    const h = messageHandlers['message.part.updated'];
    expect(h.title).toBe('====MESSAGE PART UPDATED====');
    expect(h.variant).toBe('info');
    expect(h.duration).toBe(5000);
    expect(h.defaultScript).toBe('message-part-updated.sh');
  });

  it('message.part.delta is info variant', () => {
    const h = messageHandlers['message.part.delta'];
    expect(h.title).toBe('====MESSAGE PART DELTA====');
    expect(h.variant).toBe('info');
    expect(h.duration).toBe(5000);
    expect(h.defaultScript).toBe('message-part-delta.sh');
  });

  it('message.removed is warning variant', () => {
    const h = messageHandlers['message.removed'];
    expect(h.title).toBe('====MESSAGE REMOVED====');
    expect(h.variant).toBe('warning');
    expect(h.duration).toBe(5000);
    expect(h.defaultScript).toBe('message-removed.sh');
  });

  it('message.updated is info variant', () => {
    const h = messageHandlers['message.updated'];
    expect(h.title).toBe('====MESSAGE UPDATED====');
    expect(h.variant).toBe('info');
    expect(h.duration).toBe(5000);
    expect(h.defaultScript).toBe('message-updated.sh');
  });

  it('all handlers have FIVE_SECONDS duration and no allowedFields', () => {
    for (const key of expectedKeys) {
      expect(messageHandlers[key].duration).toBe(5000);
      expect(messageHandlers[key].allowedFields).toBeUndefined();
      expect(messageHandlers[key].defaultTemplate).toBeUndefined();
    }
  });
});
