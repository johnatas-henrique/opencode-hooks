# ADR-001: Plugin Folder Structure Refactor

**Date:** 2026-04-16  
**Status:** Implemented  
**Deciders:** Johnatas Henrique

---

## Context

The current `.opencode/plugins/` structure has accumulated files without clear organization:

```
.opencode/plugins/
├── helpers/          # Catch-all directory (confusing)
│   ├── config/
│   ├── default-handlers.ts (959 lines)
│   ├── events.ts (543 lines)
│   └── ... (15+ files)
├── types/
└── opencode-hooks.ts
```

**Problems identified:**

1. `helpers/` name doesn't communicate purpose
2. User-editable files buried in `helpers/config/`
3. `predicates` terminology is too technical for security rules
4. Internal vs external code not distinguished
5. Code related by domain scattered across `helpers/`

---

## Decision

Adopt a **clarity-first** organization with clear boundaries:

```
.opencode/plugins/
├── opencode-hooks.ts     # Entry point (MUST NOT rename)
├── config/               # USER-FACING (easy to find)
│   ├── settings.ts       # Main user configuration
│   └── security-rules.ts # Renamed from blocks.ts
├── features/             # INTERNAL (domain-driven)
│   ├── block-system/
│   ├── events/
│   └── messages/
└── types/                # INTERNAL (shared definitions)
```

---

## Rationale

### 1. `config/` at plugin root

- **Prospect theory:** Make user-editable files visible and prominent
- Users know exactly where to edit = lower friction
- Natural onboarding for new users

### 2. `features/` for internal code

- Groups code by domain (block-system, events, messages)
- No technical jargon in directory names
- Each feature folder is self-contained

### 3. `security-rules.ts` (renamed from `blocks.ts`)

- `BlockPredicate` → `SecurityRule`
- Self-documenting: tells users what the file does
- Aligns with user's mental model

### 4. Keep `opencode-hooks.ts` as entry point

- OpenCode loads `.ts` files that export `Plugin`
- Renaming to `index.ts` would make it a separate plugin
- Entry point name reflects the plugin identity

---

## Constraints from OpenCode Plugin System

Based on [official documentation](https://opencode.ai/docs/plugins):

1. **Each `.ts` file in `.opencode/plugins/` is a separate plugin**
2. **Plugin must export a function of type `Plugin`**
3. **Multiple plugins coexist** - hooks run in sequence
4. **Dependencies via `.opencode/package.json`**

This means:

- Only `opencode-hooks.ts` should export `Plugin`
- All other files are internal imports
- `config/` files are user config, not plugins

---

## Migration Plan

### Phase 1: Create new structure (no changes to existing code)

1. Create `config/` directory
2. Create `features/block-system/`, `features/events/`, `features/messages/`
3. Move files incrementally, update imports

### Phase 2: Rename `blocks.ts` → `security-rules.ts`

1. Rename file
2. Update import references
3. Update type names (`BlockPredicate` → `SecurityRule`)

### Phase 3: Verify functionality

1. Run tests (`npm run test:unit`)
2. Run lint (`npm run lint`)
3. Typecheck (`npm run build`)

---

## Consequences

### Positive

- Clear separation between user code and internal code
- Self-documenting structure
- Easier to onboard new contributors

### Negative

- Git will show files as deleted/added (can be mitigated with `git mv`)
- Temporary import path changes during migration

### Risks

- Import paths in tests need updating
- Third-party references (e.g., README, docs) need updating

---

## References

- [OpenCode Plugins Documentation](https://opencode.ai/docs/plugins)
- [OpenCode Plugin Development Guide](https://gist.github.com/rstacruz/946d02757525c9a0f49b25e316fbe715)
