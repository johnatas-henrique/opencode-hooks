import { describe, it, expect, vi, beforeEach } from 'vitest';

// fallow-ignore-next-line code-duplication
const mockFs = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    existsSync: fn(),
    readFileSync: fn(),
    readdirSync: fn(),
    writeFileSync: fn(),
    mkdirSync: fn(),
    unlinkSync: fn(),
    statSync: fn(),
    appendFileSync: fn(),
  };
});
vi.mock('fs', () => ({ default: mockFs }));

// Mock os
vi.mock('os', () => ({
  default: {
    homedir: vi.fn(() => '/test/home'),
  },
}));

import {
  mapClaudeHookToOpenCode,
  loadClaudeSettings,
} from '.opencode/plugins/features/adapters/claude-settings';

describe('mapClaudeHookToOpenCode', () => {
  it('maps PreToolUse to tool.execute.before', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      matcher: 'bash',
      hooks: [{ command: 'scripts/pre-hook.sh' }],
    });
    expect(result.openCodeEvent).toBe('tool.execute.before');
    expect(result.scripts).toHaveLength(1);
    expect(result.scripts[0].source).toBe('claude');
    expect(result.scripts[0].path).toBe('scripts/pre-hook.sh');
    expect(result.scripts[0].matcher).toBe('bash');
  });

  it('maps unknown events as unsupported', () => {
    const result = mapClaudeHookToOpenCode('UnknownEvent', {
      hooks: [{ command: 'unk.sh' }],
    });
    expect(result.openCodeEvent).toBe('');
    expect(result.scripts).toHaveLength(1);
  });
});

describe('loadClaudeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty hooks when hooks is missing', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue(JSON.stringify({}));
    const result = loadClaudeSettings('/test/project');
    expect(result).toEqual({});
  });

  it('merges global and local scripts with different matchers', () => {
    const globalPath = '/test/home/.claude/settings.json';
    const localPath = '/test/project/.claude/settings.json';

    vi.mocked(mockFs.existsSync).mockImplementation((p) => {
      const s = p.toString();
      return s === globalPath || s === localPath;
    });

    vi.mocked(mockFs.readFileSync).mockImplementation((p) => {
      if (p.toString() === globalPath) {
        return JSON.stringify({
          hooks: {
            PreToolUse: [
              { matcher: { app: 'bash' }, hooks: [{ command: 'first.sh' }] },
            ],
          },
        });
      } else {
        return JSON.stringify({
          hooks: {
            PreToolUse: [
              { matcher: { app: 'write' }, hooks: [{ command: 'second.sh' }] },
            ],
          },
        });
      }
    });

    const result = loadClaudeSettings('/test/project');
    expect(result['tool.execute.before']).toHaveLength(2);
    expect(result['tool.execute.before'][0].path).toBe('first.sh');
    expect(result['tool.execute.before'][1].path).toBe('second.sh');
  });

  it('returns empty when no files exist', () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(false);
    const result = loadClaudeSettings('/test/project');
    expect(result).toEqual({});
  });
});
