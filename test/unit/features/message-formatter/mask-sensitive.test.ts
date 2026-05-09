import { describe, it, expect } from 'vitest';
import { maskSensitive } from '.opencode/plugins/features/message-formatter/formatters';

describe('maskSensitive', () => {
  it('does not modify a string without sensitive patterns', () => {
    const input = 'Hello, this is a safe message.';
    expect(maskSensitive(input)).toBe(input);
  });

  it('redacts api_key values', () => {
    const result = maskSensitive('api_key=sk-abc123');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('sk-abc123');
  });

  it('redacts api-key values', () => {
    const result = maskSensitive('api-key: secret-key-here');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('secret-key-here');
  });

  it('redacts token values', () => {
    const result = maskSensitive('token=ghp_abc123');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('ghp_abc123');
  });

  it('redacts secret values', () => {
    const result = maskSensitive('secret=supersecretvalue');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('supersecretvalue');
  });

  it('redacts password values', () => {
    const result = maskSensitive('password=mypassword123');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('mypassword123');
  });

  it('redacts credential values', () => {
    const result = maskSensitive('credential: mycreddata');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('mycreddata');
  });

  it('redacts bearer tokens', () => {
    const result = maskSensitive('Authorization: bearer tok123');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('tok123');
  });

  it('redacts github tokens (ghp_, gho_, ghu_, ghs_, ghr_)', () => {
    const result = maskSensitive('token ghp_abcdef1234567890');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('ghp_abcdef1234567890');
  });

  it('uses custom patterns when provided', () => {
    const customPatterns: Array<[RegExp, string]> = [
      [/(customKey)[=:]\s*["']?(\w+)["']?/gi, '$1'],
    ];
    const result = maskSensitive('customKey=myvalue', customPatterns);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('myvalue');
  });

  it('handles empty string', () => {
    expect(maskSensitive('')).toBe('');
  });

  it('handles multiple sensitive patterns in one string', () => {
    const input = 'api_key=abc123 and token=xyz789';
    const result = maskSensitive(input);
    expect(result).not.toContain('abc123');
    expect(result).not.toContain('xyz789');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts values with quotes around them', () => {
    const result = maskSensitive('api_key="my-api-key"');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('my-api-key');
  });
});
