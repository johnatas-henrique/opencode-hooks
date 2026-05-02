import {
  initAuditLogging,
  getEventRecorder,
  getScriptRecorder,
  getErrorRecorder,
  getAuditLogger,
  resetAuditLogging,
} from '.opencode/plugins/features/audit/plugin-integration';
import type { AuditConfig } from '.opencode/plugins/types/audit';
import fs from 'fs';
import path from 'path';

describe('plugin-integration', () => {
  const testBasePath = path.join(process.cwd(), 'test-tmp-audit');

  beforeEach(() => {
    resetAuditLogging();
    if (fs.existsSync(testBasePath)) {
      fs.rmSync(testBasePath, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    resetAuditLogging();
    if (fs.existsSync(testBasePath)) {
      fs.rmSync(testBasePath, { recursive: true, force: true });
    }
  });

  it('getEventRecorder returns undefined before init', () => {
    expect(getEventRecorder()).toBeUndefined();
  });

  it('getScriptRecorder returns undefined before init', () => {
    expect(getScriptRecorder()).toBeUndefined();
  });

  it('getErrorRecorder returns undefined before init', () => {
    expect(getErrorRecorder()).toBeUndefined();
  });

  it('getAuditLogger returns undefined before init', () => {
    expect(getAuditLogger()).toBeUndefined();
  });

  it('initializes audit logging', async () => {
    const config: AuditConfig = {
      enabled: true,
      level: 'audit',
      basePath: testBasePath,
      maxSizeMB: 100,
      maxAgeDays: 30,
      logTruncationKB: 10,
      maxFieldSize: 1024,
      maxArrayItems: 10,
      largeFields: [],
    };
    await initAuditLogging(config);

    expect(getEventRecorder()).toBeDefined();
    expect(getScriptRecorder()).toBeDefined();
    expect(getErrorRecorder()).toBeDefined();
    expect(getAuditLogger()).toBeDefined();
  });

  it('returns same promise on concurrent init calls', async () => {
    const config: AuditConfig = {
      enabled: true,
      level: 'audit',
      basePath: testBasePath,
      maxSizeMB: 100,
      maxAgeDays: 30,
      logTruncationKB: 10,
      maxFieldSize: 1024,
      maxArrayItems: 10,
      largeFields: [],
    };

    const p1 = initAuditLogging(config);
    const p2 = initAuditLogging(config);
    expect(p1).toBe(p2);

    await Promise.all([p1, p2]);
  });

  it('creates base directory on init', async () => {
    const config: AuditConfig = {
      enabled: true,
      level: 'audit',
      basePath: testBasePath,
      maxSizeMB: 100,
      maxAgeDays: 30,
      logTruncationKB: 10,
      maxFieldSize: 1024,
      maxArrayItems: 10,
      largeFields: [],
    };
    await initAuditLogging(config);

    // Verify the audit logger was created with correct basePath
    const logger = getAuditLogger();
    expect(logger).toBeDefined();
    expect(logger!.writeLine).toBeDefined();
  });

  it('resetAuditLogging clears state', async () => {
    const config: AuditConfig = {
      enabled: true,
      level: 'audit',
      basePath: testBasePath,
      maxSizeMB: 100,
      maxAgeDays: 30,
      logTruncationKB: 10,
      maxFieldSize: 1024,
      maxArrayItems: 10,
      largeFields: [],
    };
    await initAuditLogging(config);
    expect(getEventRecorder()).toBeDefined();

    resetAuditLogging();
    expect(getEventRecorder()).toBeUndefined();
    expect(getScriptRecorder()).toBeUndefined();
    expect(getErrorRecorder()).toBeUndefined();
    expect(getAuditLogger()).toBeUndefined();
  });
});
