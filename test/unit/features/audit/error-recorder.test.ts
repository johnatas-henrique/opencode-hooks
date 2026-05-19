import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getErrorType,
  createErrorRecord,
  createErrorRecorder,
} from '.opencode/plugins/features/audit/error-recorder';
import type {
  ConfigErrorContext,
  CodeErrorContext,
} from '.opencode/plugins/types/audit';
import { makeAuditConfig as makeConfig } from '../../../helpers/audit-config';

describe('getErrorType', () => {
  it('returns "code" when context has "error" key', () => {
    const context: CodeErrorContext = { error: new Error('boom') };
    expect(getErrorType(context)).toBe('code');
  });

  it('returns "config" when context does not have "error" key', () => {
    const context: ConfigErrorContext = { message: 'invalid config' };
    expect(getErrorType(context)).toBe('config');
  });
});

describe('createErrorRecord', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('returns null when shouldLog is false', () => {
    const context: ConfigErrorContext = { message: 'err' };
    expect(createErrorRecord(context, false)).toBeNull();
  });

  it('creates config error record', () => {
    const context: ConfigErrorContext = {
      message: 'missing field',
      eventType: 'tool.execute.before',
      toolName: 'bash',
      scriptPath: 'test.sh',
    };
    const record = createErrorRecord(context, true);
    expect(record).not.toBeNull();
    expect(record!.type).toBe('config');
    expect(record!.error).toBe('missing field');
    expect(record!.eventType).toBe('tool.execute.before');
    expect(record!.toolName).toBe('bash');
    expect(record!.scriptPath).toBe('test.sh');
    expect(record!.ts).toEqual(expect.any(String));
  });

  it('creates code error record with stack', () => {
    const error = new Error('runtime error');
    const context: CodeErrorContext = { error, context: 'during execution' };
    const record = createErrorRecord(context, true);
    expect(record).not.toBeNull();
    expect(record!.type).toBe('code');
    expect(record!.error).toBe('runtime error');
    expect(record!.context).toBe('during execution');
    expect(record!.stack).toEqual(expect.any(String));
  });

  it('skips stack when skipStack is true', () => {
    const error = new Error('no stack');
    const context: CodeErrorContext = { error, skipStack: true };
    const record = createErrorRecord(context, true);
    expect(record).not.toBeNull();
    expect(record!.error).toBe('no stack');
    expect(record!.stack).toBeUndefined();
  });
});

describe('createErrorRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls writeLine on error', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig();
    const recorder = createErrorRecorder(config, { writeLine: mockWriteLine });

    const context: ConfigErrorContext = { message: 'test error' };
    await recorder.logError(context);

    expect(mockWriteLine).toHaveBeenCalledOnce();
    expect(mockWriteLine.mock.calls[0][0]).toBe('errors');
    const record = mockWriteLine.mock.calls[0][1] as Record<string, unknown>;
    expect(record.type).toBe('config');
    expect(record.error).toBe('test error');
  });

  it('does not call writeLine when config is disabled', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig({ enabled: false });
    const recorder = createErrorRecorder(config, { writeLine: mockWriteLine });

    const context: ConfigErrorContext = { message: 'should not log' };
    await recorder.logError(context);

    expect(mockWriteLine).not.toHaveBeenCalled();
  });

  it('creates code error record via logError', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig();
    const recorder = createErrorRecorder(config, { writeLine: mockWriteLine });

    const context: CodeErrorContext = {
      error: new Error('code error'),
      context: 'exec',
    };
    await recorder.logError(context);

    expect(mockWriteLine).toHaveBeenCalledOnce();
    const record = mockWriteLine.mock.calls[0][1] as Record<string, unknown>;
    expect(record.type).toBe('code');
    expect(record.error).toBe('code error');
    expect(record.context).toBe('exec');
  });
});
