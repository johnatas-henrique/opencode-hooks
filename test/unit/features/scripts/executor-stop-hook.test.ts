import {
  getStopHookActive,
  setStopHookState,
  clearStopHookState,
  getStopHookStateFile,
} from '.opencode/plugins/features/scripts/executor';
import fs from 'fs';
import path from 'path';

describe('executor - stop hook state', () => {
  const testSessionId = 'test-session-123';
  let stateFile: string;

  beforeEach(() => {
    stateFile = path.join(
      process.cwd(),
      'production',
      'hook-state',
      `${testSessionId}_stop_flag`
    );
    // Clean up before each test
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }
    const dir = path.dirname(stateFile);
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach((f) => {
        fs.unlinkSync(path.join(dir, f));
      });
    }
  });

  afterAll(() => {
    const dir = path.dirname(stateFile);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('getStopHookStateFile returns correct path', () => {
    const file = getStopHookStateFile(testSessionId);
    expect(file).toContain('hook-state');
    expect(file).toContain(testSessionId);
    expect(file).toContain('_stop_flag');
  });

  it('getStopHookActive returns false when file does not exist', () => {
    const result = getStopHookActive(testSessionId);
    expect(result).toBe(false);
  });

  it('getStopHookActive returns true when file exists', () => {
    setStopHookState(testSessionId);
    const result = getStopHookActive(testSessionId);
    expect(result).toBe(true);
  });

  it('setStopHookState creates the file', () => {
    setStopHookState(testSessionId);
    expect(fs.existsSync(stateFile)).toBe(true);
  });

  it('clearStopHookState removes the file', () => {
    setStopHookState(testSessionId);
    expect(getStopHookActive(testSessionId)).toBe(true);

    clearStopHookState(testSessionId);
    expect(getStopHookActive(testSessionId)).toBe(false);
  });

  it('clearStopHookState does not throw when file does not exist', () => {
    expect(() => clearStopHookState('nonexistent')).not.toThrow();
  });

  it('getStopHookActive returns false on fs error', () => {
    // Mock existsSync to throw
    const originalExistsSync = fs.existsSync;
    fs.existsSync = () => {
      throw new Error('fs error');
    };

    const result = getStopHookActive(testSessionId);
    expect(result).toBe(false);

    fs.existsSync = originalExistsSync;
  });
});
