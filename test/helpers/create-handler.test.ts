import { describe, it, expect, vi } from 'vitest';
import { createHandler, createHandlers } from './create-handler';

describe('createHandler', () => {
  it('should create handler with default values when no overrides provided', () => {
    const handler = createHandler({});
    expect(handler.title).toBe('====TEST====');
    expect(handler.variant).toBe('info');
    expect(handler.duration).toBe(2000);
    expect(handler.defaultScript).toBe('test.sh');
  });

  it('should use default buildMessage when no override provided', () => {
    const handler = createHandler({});
    const message = handler.buildMessage({ test: 'data' });
    expect(message).toBe('test message');
  });

  it('should override title when provided', () => {
    const handler = createHandler({ title: 'Custom Title' });
    expect(handler.title).toBe('Custom Title');
  });

  it('should override variant to warning', () => {
    const handler = createHandler({ variant: 'warning' });
    expect(handler.variant).toBe('warning');
  });

  it('should override duration to 5000ms', () => {
    const handler = createHandler({ duration: 5000 });
    expect(handler.duration).toBe(5000);
  });

  it('should override defaultScript', () => {
    const handler = createHandler({ defaultScript: 'custom.sh' });
    expect(handler.defaultScript).toBe('custom.sh');
  });

  it('should override buildMessage function', () => {
    const customMessage = () => 'custom message';
    const handler = createHandler({ buildMessage: customMessage });
    expect(handler.buildMessage).toBe(customMessage);
  });

  it('should add allowedFields when provided', () => {
    const handler = createHandler({ allowedFields: ['name', 'path'] });
    expect(handler.allowedFields).toEqual(['name', 'path']);
  });

  it('should add defaultTemplate when provided', () => {
    const handler = createHandler({ defaultTemplate: '{{name}} executed' });
    expect(handler.defaultTemplate).toBe('{{name}} executed');
  });

  it('should merge multiple overrides correctly', () => {
    const handler = createHandler({
      title: 'New Title',
      variant: 'error',
      duration: 3000,
      allowedFields: ['stdout'],
    });
    expect(handler.title).toBe('New Title');
    expect(handler.variant).toBe('error');
    expect(handler.duration).toBe(3000);
    expect(handler.allowedFields).toEqual(['stdout']);
    expect(handler.defaultScript).toBe('test.sh');
  });

  it('should call buildMessage with correct parameters', () => {
    const mockBuildMessage = vi.fn(() => 'test');
    const handler = createHandler({ buildMessage: mockBuildMessage });
    const event = { name: 'test', path: '/test' };
    handler.buildMessage(event, ['name']);
    expect(mockBuildMessage).toHaveBeenCalledWith(event, ['name']);
  });
});

describe('createHandlers', () => {
  it('should create empty object when no configs provided', () => {
    const handlers = createHandlers({});
    expect(handlers).toEqual({});
  });

  it('should create single handler with default values', () => {
    const handlers = createHandlers({ 'tool.execute.before': {} });
    expect(handlers['tool.execute.before']).toBeDefined();
    expect(handlers['tool.execute.before'].title).toBe('====TEST====');
  });

  it('should create multiple handlers with overrides', () => {
    const handlers = createHandlers({
      'tool.execute.before': { title: 'Before Tool' },
      'tool.execute.after': { title: 'After Tool' },
    });
    expect(handlers['tool.execute.before'].title).toBe('Before Tool');
    expect(handlers['tool.execute.after'].title).toBe('After Tool');
  });

  it('should maintain separate configs for different events', () => {
    const handlers = createHandlers({
      session: { variant: 'info', duration: 2000 },
      tool: { variant: 'warning', duration: 5000 },
    });
    expect(handlers.session.variant).toBe('info');
    expect(handlers.session.duration).toBe(2000);
    expect(handlers.tool.variant).toBe('warning');
    expect(handlers.tool.duration).toBe(5000);
  });

  it('should handle 5 different event types', () => {
    const handlers = createHandlers({
      'session.created': { title: 'Session Created' },
      'session.ended': { title: 'Session Ended' },
      'tool.execute.before': { title: 'Tool Before' },
      'tool.execute.after': { title: 'Tool After' },
      error: { variant: 'error' },
    });
    expect(Object.keys(handlers)).toHaveLength(5);
    expect(handlers['session.created'].title).toBe('Session Created');
    expect(handlers['error'].variant).toBe('error');
  });

  it('should pass all override properties to each handler', () => {
    const handlers = createHandlers({
      'tool.execute.before': {
        title: 'Custom',
        variant: 'warning',
        duration: 4000,
        defaultScript: 'custom.sh',
        allowedFields: ['stdout'],
        defaultTemplate: 'test',
      },
    });
    const handler = handlers['tool.execute.before'];
    expect(handler.title).toBe('Custom');
    expect(handler.variant).toBe('warning');
    expect(handler.duration).toBe(4000);
    expect(handler.defaultScript).toBe('custom.sh');
    expect(handler.allowedFields).toEqual(['stdout']);
    expect(handler.defaultTemplate).toBe('test');
  });
});
