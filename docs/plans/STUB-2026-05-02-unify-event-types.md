# STUB: Unificar OpenCodeEvents e EventType

**Status:** Pendente — não iniciado
**Objetivo:** Unificar `OpenCodeEvents` (types/core.ts) e `EventType` (types/events.ts) num único enum/const que cubra todos os eventos de ambos.

## Problema

- `OpenCodeEvents`: runtime const que serve de base pros tipos `OpenCodeEventType`, `OpenCodeEventMap`, etc. Tem eventos PTY, VCS, etc.
- `EventType`: enum usado em `opencode-hooks.ts`, `settings.ts`, handlers. Tem eventos CHAT, EXPERIMENTAL, etc.
- Overlap parcial, cada um com eventos que o outro não tem.

## O que fazer

1. Mapear diferenças entre os dois conjuntos
2. Decidir nome e forma (enum vs `as const`)
3. Unificar num único arquivo de tipos de evento
4. Atualizar todos os imports de `EventType` para o novo local
5. Remover o arquivo/const antigo
6. Verificar se `OpenCodeEventType`, `OpenCodeEventMap` etc. continuam funcionando
