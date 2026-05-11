import { describe, it, expect } from 'vitest';
import { sessionHandlers } from '.opencode/plugins/features/handlers/session-handlers';
import { expectHandlerProps } from '../../../helpers/handler-assertions';

describe('sessionHandlers', () => {
  const expectedKeys = [
    'session.created',
    'session.compacted',
    'session.deleted',
    'session.error',
    'session.diff',
    'session.idle',
    'session.status',
    'session.updated',
    'session.unknown',
  ] as const;

  it('contains all expected keys', () => {
    for (const key of expectedKeys) {
      expect(sessionHandlers).toHaveProperty(key);
    }
    expect(Object.keys(sessionHandlers).length).toBe(expectedKeys.length);
  });

  it('each handler has required properties', () => {
    expectHandlerProps(sessionHandlers, expectedKeys);
  });

  it('session.created has correct title, variant, and allowedFields', () => {
    const h = sessionHandlers['session.created'];
    expect(h.title).toBe('====SESSION CREATED====');
    expect(h.variant).toBe('success');
    expect(h.duration).toBe(10000);
    expect(h.defaultScript).toBe('session-created.sh');
    expect(h.allowedFields).toEqual([
      'info.id',
      'info.title',
      'info.directory',
      'info.parentID',
    ]);
    expect(h.defaultTemplate).toBe(
      '[{timestamp}] Session: {info.id} | Project: {info.directory}'
    );
  });

  it('session.compacted has configurable fields', () => {
    const h = sessionHandlers['session.compacted'];
    expect(h.title).toBe('====SESSION COMPACTED====');
    expect(h.variant).toBe('info');
    expect(h.duration).toBe(10000);
    expect(h.defaultScript).toBe('session-compacted.sh');
    expect(h.allowedFields).toEqual(['sessionID', 'contextSize']);
    expect(h.defaultTemplate).toBe(
      '[{timestamp}] Session compacted: {properties.sessionID}'
    );
  });

  it('session.deleted is error variant with FIVE_SECONDS', () => {
    const h = sessionHandlers['session.deleted'];
    expect(h.title).toBe('====SESSION DELETED====');
    expect(h.variant).toBe('error');
    expect(h.duration).toBe(5000);
    expect(h.defaultScript).toBe('session-deleted.sh');
    expect(h.allowedFields).toEqual(['info.id']);
  });

  it('session.error has allowedFields for error data', () => {
    const h = sessionHandlers['session.error'];
    expect(h.title).toBe('====SESSION ERROR====');
    expect(h.variant).toBe('error');
    expect(h.duration).toBe(10000);
    expect(h.defaultScript).toBe('session-error.sh');
    expect(h.allowedFields).toEqual([
      'sessionID',
      'error.name',
      'error.data.message',
    ]);
  });

  it('session.diff, session.idle, session.status, session.updated, session.unknown have basic config', () => {
    const basicKeys = [
      'session.diff',
      'session.idle',
      'session.status',
      'session.updated',
      'session.unknown',
    ] as const;
    for (const key of basicKeys) {
      const h = sessionHandlers[key];
      expect(h.title).toBeDefined();
      expect(['info', 'warning']).toContain(h.variant);
      expect(h.duration).toBe(5000);
      expect(h.defaultScript).toMatch(/^session-/);
    }
  });
});
