# RFC: Deep Module — Message Formatters

**Status**: Approved  
**Priority**: Medium  
**Date**: 2026-04-16  
**Author**: Architecture Review

---

## Summary

Extract pure message formatting helpers from `default-handlers.ts` into a testable deep module.

---

## Problem Statement

`default-handlers.ts` (959 lines, 60+ handlers) has internal helpers that are NOT exported:

| Helper                      | Lines | Problem                               |
| --------------------------- | ----- | ------------------------------------- |
| `SENSITIVE_PATTERNS`        | 8     | Not configurable                      |
| `maskSensitive(str)`        | 10    | Can't test alone                      |
| `truncate(str)`             | 5     | Depends on `TRUNCATE_LENGTH` constant |
| `formatValue(value)`        | 8     | Combines mask + truncate              |
| `getValueByPath(obj, path)` | 6     | Useful utility, untested              |
| `formatTime()`              | 2     | Date formatting logic mixed           |

**Issues:**

- Interface ≈ Implementation (shallow module)
- Any change requires updating all handler tests
- Can't test `maskSensitive` in isolation

---

## Current State

```typescript
// Internal functions - NOT exported
const SENSITIVE_PATTERNS = [
  [/(api[_-]?key)[=:]\s*["']?[\w-]+["']?/gi, '$1'],
  // ...
];

const maskSensitive = (str: string): string => {
  let result = str;
  for (const [pattern, group] of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, `${group}: [REDACTED]`);
  }
  return result;
};

// Used by buildMessage - can't test independently
const formatValue = (value: unknown): string => {
  const str = JSON.stringify(value);
  return truncate(maskSensitive(str));
};
```

---

## Proposed Architecture

```
helpers/message-formatter/
├── index.ts              # Public API (1 line exports)
├── types.ts             # FormatterConfig, FormatterResult
├── mask-sensitive.ts    # Pure: regex redaction
├── truncate.ts          # Pure: length control
├── format-value.ts      # Combine mask + truncate
├── get-value-by-path.ts # Pure: dot notation access
└── config.ts            # Default patterns, lengths
```

---

## Interface Signatures

```typescript
// types.ts
export interface FormatterConfig {
  truncateLength: number;
  sensitivePatterns: Array<[RegExp, string]>;
  maskToken: string;
}

export interface FormatterResult {
  value: string;
  truncated: boolean;
  masked: boolean;
}

// index.ts - Clean public API
export { maskSensitive, maskSensitiveWithConfig } from './mask-sensitive';
export { truncate, truncateWithConfig } from './truncate';
export { formatValue, formatValueWithConfig } from './format-value';
export { getValueByPath, setValueByPath } from './get-value-by-path';
export { createFormatter, DEFAULT_FORMATTER_CONFIG } from './config';
```

---

## Usage Examples

### Before (current — can't test alone)

```typescript
// In default-handlers.ts
const formatValue = (value: unknown): string => {
  const str = JSON.stringify(value);
  return truncate(maskSensitive(str)); // Tied together
};
```

### After (pure, testable)

```typescript
// New: helpers/message-formatter/index.ts
export { maskSensitive, truncate, formatValue, getValueByPath };

// Unit test: helpers/message-formatter/__tests__/mask-sensitive.test.ts
import { maskSensitive } from '../mask-sensitive';

describe('maskSensitive', () => {
  it('redacts api keys', () => {
    expect(maskSensitive('api_key=abc123')).toBe('api_key: [REDACTED]');
  });

  it('redacts tokens', () => {
    expect(maskSensitive('token=xyz789')).toBe('token: [REDACTED]');
  });

  it('preserves non-sensitive data', () => {
    expect(maskSensitive('name=John')).toBe('name=John');
  });
});
```

---

## Complexity Hidden

| Internally          | Before           | After                      |
| ------------------- | ---------------- | -------------------------- |
| Pattern iteration   | Mixed with logic | `maskSensitive()` loop     |
| Truncation boundary | Hardcoded        | `truncate()` pure function |
| Value formatting    | 20 lines inline  | `formatValue()`            |
| Path access         | 6 lines repeated | `getValueByPath()`         |

---

## Migration Path

```typescript
// STEP 1: Create new module
helpers/message-formatter/
  ├── index.ts
  ├── types.ts
  ├── mask-sensitive.ts
  ├── truncate.ts
  ├── format-value.ts
  ├── get-value-by-path.ts
  └── config.ts

// STEP 2: Export from message-formatter/index.ts
export { maskSensitive, truncate, formatValue, getValueByPath } from './mask-sensitive';
// ... etc

// STEP 3: Update default-handlers.ts imports
import { maskSensitive, truncate, formatValue } from './message-formatter';

// STEP 4: Add tests
helpers/message-formatter/__tests__/format-value.test.ts

// STEP 5: Remove old inline functions
```

---

## Testability Gain

```typescript
// Before: Test through handlers object
const message = handlers['session.created'].buildMessage(event);
expect(message).toContain('...'); // Indirect

// After: Test pure functions directly
expect(formatValue(longString)).toContain('...'); // Direct
expect(maskSensitive('key=123')).toBe('key: [REDACTED]'); // Direct
expect(truncate('hello world', 5)).toBe('hello...'); // Direct
```

---

## Next Steps

- [ ] User reviews this RFC
- [ ] Create `helpers/message-formatter/` module
- [ ] Move pure functions one by one
- [ ] Write unit tests for each helper
- [ ] Update `default-handlers.ts` imports
