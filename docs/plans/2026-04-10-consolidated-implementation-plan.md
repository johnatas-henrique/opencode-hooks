# 2026-04-10: Plano Consolidado - Implementação de 9 Features

## Execution

| Phase      | Step | Description                                                  | Status | Timestamp            |
| ---------- | ---- | ------------------------------------------------------------ | ------ | -------------------- |
| **Fase 1** | 1.1  | Refactorar `resolveToolConfig` - herança direta de `default` | ✅     | 2026-04-10 14:35 UTC |
|            | 1.2  | Corrigir herança de config vazia `{}`                        | ✅     | 2026-04-10 14:40 UTC |
|            | 1.3  | Documentar debug granular por tool                           | ✅     | 2026-04-10 14:45 UTC |
| **Fase 2** | 2.1  | Adicionar eventType/toolName em script errors                | ⏳     | -                    |
|            | 2.2  | Melhorar formatação de exibição de erros                     | ⏳     | -                    |
|            | 2.3  | Consolidar toasts de múltiplos scripts                       | ⏳     | -                    |
| **Fase 3** | 3.1  | Implementar feature `runOnce`                                | ⏳     | -                    |
|            | 3.2  | Criar sistema de teste para scripts                          | ⏳     | -                    |
|            | 3.3  | Implementar novos hooks baseados no ECC                      | ⏳     | -                    |
| **Fase 4** | 4.1  | Criar tool-specific handlers (read, write, bash, task, etc.) | ⏳     | -                    |
|            | 4.2  | Modificar `resolveToolConfig` para usar handlers             | ⏳     | -                    |
|            | 4.3  | Simplificar `user-events.config.ts`                          | ⏳     | -                    |
|            | 4.4  | Atualizar testes e documentação                              | ⏳     | -                    |

---

## Estratégia

1. **Fase 1 (Fundamento)**: Corrige inconsistências de herança de configuração — base para melhorias futuras
2. **Fase 2 (Core)**: Melhoria direta na experiência do usuário (erros + toasts)
3. **Fase 3 (Expansão)**: Novas features e cobertura de testes
4. **Fase 4 (Ux Optimization)**: Tool-specific handlers paraUX consistente

**Critério de conclusão por fase**: Todos os steps da fase marcados como ✅ + builds/tests passando + commit atômico

**Próximo passo**: Revisar Fase 1 concluída antes de prosseguir
