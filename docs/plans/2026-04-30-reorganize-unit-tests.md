# Reorganização de test/unit/ — Colocalização com .opencode/Plugins

## Status

- [ ] Em progresso

## Coverage atual

- Lines: 99.08% | Functions: 99% | Stmts: 98.92% | Branches: 97.48%

## Procedimento

Para cada arquivo:

1. Criar pasta destino se não existir
2. Mover arquivo
3. Ajustar imports (../../.opencode/Plugins → ../../../.opencode/Plugins, etc)
4. Rodar `npm run test:cov`
5. Verificar coverage não caiu

## Estrutura target

test/unit/
├── config/
│ ├── claude-settings.test.ts
│ ├── security-rules.test.ts
│ └── settings.test.ts
├── core/
│ ├── debug.test.ts
│ ├── toast-queue.test.ts
│ └── constants.test.ts
└── features/
├── audit/
│ ├── audit-logger.test.ts
│ ├── audit-plugin-integration.test.ts
│ ├── debug-recorder.test.ts
│ ├── error-recorder.test.ts
│ ├── event-recorder.test.ts
│ ├── plugin-integration.test.ts
│ ├── script-recorder.test.ts
│ └── security-recorder.test.ts
├── block-system/
│ ├── block-handler.test.ts
│ ├── block-handler-null-recorder.test.ts
│ └── block-system.test.ts
├── events/
│ ├── context.test.ts
│ ├── events.test.ts
│ ├── get-tool-handler.test.ts
│ ├── resolution/
│ │ ├── boolean-field.test.ts
│ │ ├── scripts.test.ts
│ │ ├── toast-resolution.test.ts
│ │ └── tool-config.test.ts
│ └── resolvers/
│ ├── build-message.test.ts
│ ├── event-config-builder.test.ts
│ ├── event-config.test.ts
│ ├── normalize-input.test.ts
│ └── tool-config-resolver.test.ts
├── handlers/
│ ├── chat-handlers.test.ts
│ ├── command-handlers.test.ts
│ ├── experimental-handlers.test.ts
│ ├── handlers.test.ts
│ ├── lsp-handlers.test.ts
│ ├── message-handlers.test.ts
│ ├── other-handlers.test.ts
│ ├── server-handlers.test.ts
│ ├── shell-handlers.test.ts
│ ├── todo-handlers.test.ts
│ ├── tool-specific-handlers.test.ts
│ └── tui-handlers.test.ts
├── message-formatter/
│ ├── build-keys-message.test.ts
│ ├── format-time.test.ts
│ ├── get-value-by-path.test.ts
│ ├── mask-sensitive.test.ts
│ └── truncate.test.ts
├── messages/
│ ├── append-to-session.test.ts
│ ├── plugin-status.test.ts
│ ├── show-active-plugins.test.ts
│ ├── show-startup-toast.test.ts
│ └── toast-silence-detector.test.ts
└── scripts/
├── adapters.test.ts
├── executor.test.ts
├── file-template.test.ts
├── run-script-handler.test.ts
├── run-script.test.ts
├── script-executor.test.ts
├── script-recorder.test.ts
└── script-runner.test.ts
opencode-hooks/
├── additional-hooks.test.ts
├── event-handler.test.ts
├── opencode-hooks-disabled.test.ts
├── opencode-hooks-enabled-coverage.test.ts
├── opencode-hooks-specialized-coverage.test.ts
├── tool-hooks.test.ts
└── validate-scripts-directory.test.ts

## Import path adjustments

| Origem                             | Destino                                | Ajuste imports                                             |
| ---------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| test/unit/arquivo.test.ts          | test/unit/featureX/arquivo.test.ts     | ../../ → ../ → (remove)                                    |
| test/unit/featureX/arquivo.test.ts | test/unit/featureX/sub/arquivo.test.ts | ../ → ../../                                               |
| test/unit/featureX/arquivo.test.ts | test/unit/featureX/sub/arquivo.test.ts | ../../.opencode/plugins → ../../../.opencode/plugins       |
| test/handlers/arquivo.test.ts      | test/featureX/handlers/arquivo.test.ts | ../../../.opencode/plugins → ../../../../.opencode/plugins |
