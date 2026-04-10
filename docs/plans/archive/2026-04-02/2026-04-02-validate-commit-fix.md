## Execution

| Step                                                  | Status | Timestamp            |
| ----------------------------------------------------- | ------ | -------------------- |
| 1. Analyze current validate-commit.sh issues          | ✅     | 2026-04-01T18:30:00Z |
| 2. Fix glob patterns and add .sh/.opencode validation | ✅     | 2026-04-02           |
| 3. Add verbose output showing staged files            | ✅     | 2026-04-02           |
| 4. Test the fixed hook                                | ✅     | 2026-04-02           |

## Issues Identified

1. **Glob patterns don't match**: Staged files (.opencode/hooks/\*.sh) don't match current patterns
2. **Silent failures**: Script passes but does no visible validation
3. **No output for skipped files**: Users don't see what's being checked

## Proposed Fix

### 1. Add .sh and .opencode validation patterns

- Add pattern for `*.sh` files to check for common issues (set -e, proper shebang)
- Add pattern for `.opencode/*` files

### 2. Add verbose output

- Show all staged files being processed
- Show "Skipped" for files that don't match any validation pattern

### 3. Improve pattern matching

- Remove quotes around glob patterns in [[]] to allow proper expansion
- Add fallback pattern to catch all staged files
