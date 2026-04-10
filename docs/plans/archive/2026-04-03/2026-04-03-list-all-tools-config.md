## Execution

| Step                                                                                                  | Status | Timestamp        |
| ----------------------------------------------------------------------------------------------------- | ------ | ---------------- |
| 1. Research/list all known OpenCode tools                                                             | ⏳     | 2026-04-03 14:32 |
| 2. Update TOOL_EXECUTE_AFTER tools with all known tools, each with debug: true AND runScripts: false  | ⏳     | -                |
| 3. Update TOOL_EXECUTE_BEFORE tools with all known tools, each with debug: true AND runScripts: false | ⏳     | -                |
| 4. Verify build passes                                                                                | ⏳     | -                |

## Overview

Update user-events.config.ts to list all known OpenCode tools in the `tools` section, each with `debug: true` and `runScripts: false` to avoid SCRIPT ERROR logs.

## Known Tools (from SDK and docs)

Based on SDK documentation and observed usage:

- `task` - Subagent calling tool
- `chat` - Chat/ask tool
- `read` - File reading tool
- `write` - File writing tool
- `glob` - File pattern matching
- `grep` - Content search
- `bash` - Terminal commands
- `filesystem_read_file` - Read file (alias)
- `filesystem_write_file` - Write file (alias)
- `filesystem_list_directory` - List directory
- `filesystem_search_files` - Search files
- `filesystem_create_directory` - Create directory
- `filesystem_move_file` - Move file
- `filesystem_get_file_info` - Get file info
- `webfetch` - Web content fetch
- `websearch` - Web search
- `codesearch` - Code search
- `playwright_browser_*` - Browser automation (multiple tools)
- `context7_*` - Context7 MCP tools
- `gh_*` - GitHub CLI tools

## Implementation

Update user-events.config.ts:

1. Add all known tools to tools section with `debug: true` AND `runScripts: false`
2. User can enable scripts for specific tools by setting `runScripts: true` and adding `scripts: ['script.sh']`
3. This avoids 40+ SCRIPT ERROR logs since most events won't have scripts

## UX Reasoning

With 40+ events and only ~7 scripts typically used, it's easier to enable runScripts: true for the few events that need it than to disable runScripts: false for all other events.
