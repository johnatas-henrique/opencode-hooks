# Architecture

## Project Structure

```
.opencode/plugins/
  opencode-hooks.ts            # Main plugin entry point
  types/                       # OpenCode event type definitions
  helpers/
    event-types.ts             # EventType enum and interfaces
    handlers.ts                # Default handlers + message builders
    events.ts                  # Config resolution logic
    user-events.config.ts      # User configuration (ONLY FILE TO EDIT)
    toast-queue.ts             # Staggered toast notification queue
    run-script.ts              # Shell script execution
    save-to-file.ts            # File persistence utility
    append-to-session.ts       # Session context appending
    constants.ts               # Shared constants
test/                          # Jest tests + mocks
```
