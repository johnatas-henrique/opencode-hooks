# 2026-04-10: Sistema de Teste para Scripts de Hook do OpenCode

## Execution

| Step                                                   | Status | Timestamp |
| ------------------------------------------------------ | ------ | --------- |
| 1. Mapear cada script ao seu evento e ação disparadora | ✅     | -         |
| 2. Criar script de teste manual (test-manual.sh)       | ⏳     | -         |
| 3. Criar guide de teste para o usuário                 | ⏳     | -         |
| 4. Criar script de verificação de outputs              | ⏳     | -         |

**Status**: Not Completed - Steps 2-4 not implemented

## Contexto

Os 37 scripts são acionados por eventos do OpenCode AI. Para testar, o usuário precisa:

1. Executar uma ação específica no OpenCode (ex: editar arquivo, rodar bash, criar sessão)
2. Verificar se o script foi executado (via toast, log, ou output)

## Step 1: Mapeamento Script → Evento → Ação

| #   | Script                                         | Evento                           | Ação para Disparar           | Como Verificar   |
| --- | ---------------------------------------------- | -------------------------------- | ---------------------------- | ---------------- |
| 1   | session-created.sh                             | session.created                  | Iniciar nova sessão OpenCode | Toast + log      |
| 2   | session-closed.sh                              | server.instance.disposed         | Fechar sessão OpenCode       | Log              |
| 3   | session-deleted-end-marker.sh                  | session.deleted                  | Deletar sessão               | Log              |
| 4   | session-idle-format-typecheck.sh               | session.idle                     | Deixar sessão idle           | Log              |
| 5   | session-idle-check-console-log.sh              | session.idle                     | Deixar sessão idle           | Log              |
| 6   | session-idle-session-end.sh                    | session.idle                     | Deixar sessão idle           | Log              |
| 7   | session-idle-cost-tracker.sh                   | session.idle                     | Deixar sessão idle           | Log              |
| 8   | session-created-context.sh                     | session.created                  | Iniciar nova sessão          | Log              |
| 9   | pre-compact.sh                                 | session.compacted                | Disparar compactação         | Log              |
| 10  | experimental-session-compacting-pre-compact.sh | experimental.session.compacting  | Disparar compactação         | Log              |
| 11  | file-edit-console-warn.sh                      | tool.execute.after (edit)        | Editar arquivo JS/TS         | Output do script |
| 12  | file-edit-config-protection.sh                 | tool.execute.after (edit)        | Editar arquivo config        | Output do script |
| 13  | file-edit-design-quality.sh                    | tool.execute.after (edit)        | Editar arquivo               | Output do script |
| 14  | file-edit-accumulator.sh                       | tool.execute.after (edit)        | Editar arquivo               | Log              |
| 15  | file-write-doc-warning.sh                      | tool.execute.before (write)      | Escrever arquivo             | Output do script |
| 16  | tool-execute-before-commit-quality.sh          | tool.execute.before (bash)       | git commit                   | Output do script |
| 17  | tool-execute-before-git-push-reminder.sh       | tool.execute.before (bash)       | git push                     | Toast            |
| 18  | tool-execute-before-block-no-verify.sh         | tool.execute.before (bash)       | git commit --no-verify       | Toast            |
| 19  | tool-execute-before-tmux-dev.sh                | tool.execute.before (bash)       | Comando tmux                 | Toast            |
| 20  | tool-execute-before-tmux-reminder.sh           | tool.execute.before (bash)       | Comando tmux                 | Toast            |
| 21  | tool-execute-before-suggest-compact.sh         | tool.execute.before (edit/write) | Editar/Escrever arquivo      | Toast            |
| 22  | tool-execute-before-mcp-health.sh              | tool.execute.before (mcp)        | Executar ferramenta MCP      | Toast            |
| 23  | tool-execute-before-governance-capture.sh      | tool.execute.before (task)       | Executar subagent            | Toast            |
| 24  | tool-execute-after-bash-audit.sh               | tool.execute.after (bash)        | Executar bash                | Log              |
| 25  | tool-execute-after-bash-cost.sh                | tool.execute.after (bash)        | Executar bash                | Log              |
| 26  | tool-execute-after-pr-created.sh               | tool.execute.after (bash)        | gh pr create                 | Log              |
| 27  | tool-execute-after-build-complete.sh           | tool.execute.after (bash)        | npm run build                | Log              |
| 28  | tool-execute-after-quality-gate.sh             | tool.execute.after (write)       | Escrever arquivo             | Log              |
| 29  | tool-execute-after-governance-capture.sh       | tool.execute.after (task)        | Executar subagent            | Log              |
| 30  | log-agent.sh                                   | tool.execute.after (task)        | Executar subagent            | Toast            |
| 31  | log-skill.sh                                   | tool.execute.after (skill)       | Executar skill               | Toast            |
| 32  | server-connected.sh                            | server.connected                 | Conectar ao servidor         | Toast            |
| 33  | tool-failed-mcp-health.sh                      | tool.failed (mcp)                | MCP falhar                   | Log              |
| 34  | session-idle-evaluate.sh                       | session.idle                     | Deixar sessão idle           | Log              |
| 35  | session-idle-desktop-notify.sh                 | session.idle                     | Deixar sessão idle           | Notificação      |
| 36  | pre-compact.sh (duplicate)                     | session.compacted                | -                            | -                |
| 37  | (additional scripts)                           | various                          | various                      | various          |

## Step 2: Criar Script de Teste Manual

O script `.opencode/scripts/test-manual.sh` que:

1. Lista todos os scripts e eventos
2. Fornece instruções clara de cada ação a executar
3. Verifica outputs em logs após execução

## Step 3: Criar Guia de Teste

Documento `docs/testing/scripts-testing-guide.md` com:

1. Tabela de mapeamento completa
2. Passo a passo para cada categoria de teste
3. Como verificar os resultados (logs, toasts, output)

## Step 4: Script de Verificação

Script que verifica os logs em `production/session-logs/` para confirmar que scripts foram executados.

---

**Nota**: Os testes sãomajoritariamente manuais pois os scripts dependem do runtime do OpenCode para executar. Não é possível testar via Jest/unit tests porque os eventos só são disparados dentro do contexto do OpenCode AI.
