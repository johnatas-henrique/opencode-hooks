# OpenCode Hooks — Documentation

A TypeScript plugin system for [OpenCode AI](https://opencode.ai) that provides
event-driven hooks for session lifecycle, tool execution, file operations, and
UI notifications (toasts).

This directory contains all user-facing documentation for configuring, extending,
and understanding the OpenCode Hooks plugin.

## Table of Contents

| Document                                             | Description                                                                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [Configuration](CONFIGURATION.md)                    | Full reference for `settings.ts` — all config fields, types, events, tools, audit, and toasts                     |
| [Scripts](SCRIPTS.md)                                | How to write and run shell scripts — stdin formats, blocking, async, exit codes, Claude Code compatibility        |
| [Security](SECURITY.md)                              | Block system, exit codes, security scripts, best practices                                                        |
| [Troubleshooting](TROUBLESHOOTING.md)                | Common issues, silent crashes, debug mode, audit logs                                                             |
| [Events](EVENTS.md)                                  | Event catalog with available fields, descriptions, and recommended toast fields for every event type              |
| [Claude Code Compatibility](CLAUDE-COMPATIBILITY.md) | How Claude Code `.sh` hooks map to OpenCode events — stdin field comparison, limitations, and migration checklist |
| [Audit System](AUDIT_SYSTEM.md)                      | Audit logging reference — log files, sanitization, archiving, and migration from legacy logging                   |

## Quick Links

- **Configuration file**: `.opencode/plugins/config/settings.ts`
- **Scripts directory**: `.opencode/scripts/`
- **Global Claude hooks**: `~/.claude/hooks/`
- **Local Claude hooks**: `.claude/hooks/`
