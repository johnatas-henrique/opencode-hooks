import { describe, it, expect } from 'vitest';
import { mapClaudeHookToOpenCode } from '.opencode/plugins/config/claude-settings';

describe('mapClaudeHookToOpenCode', () => {
  it('maps Stop to session.idle', () => {
    const result = mapClaudeHookToOpenCode('Stop', {
      hooks: [{ command: 'bash idle.sh' }],
    });
    expect(result.openCodeEvent).toBe('session.idle');
  });

  it('extracts command path correctly', () => {
    const result = mapClaudeHookToOpenCode('PreToolUse', {
      hooks: [{ command: 'node scripts/hook.js' }],
    });
    expect(result.scripts[0].path).toBe('scripts/hook.js');
  });
});
