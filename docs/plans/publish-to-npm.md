# Publicar OpenCode Hooks no NPM

## O que é NPM

NPM (Node Package Manager) é o registro público de pacotes JavaScript/TypeScript. `npm publish` envia seu pacote para lá. Qualquer desenvolvedor pode instalar com `npm install <seu-pacote>`.

---

## Pré-requisito: Conta no NPM

1. Criar conta em https://www.npmjs.com/signup
2. No terminal: `npm login`

---

## Passo 1: Escolher nome do pacote

`opencode-hooks` já está ocupado no NPM por outro autor.

| Opção                               | Nome                                | Como instala                                    |
| ----------------------------------- | ----------------------------------- | ----------------------------------------------- |
| **A) Scoped package (recomendado)** | `@johnatas-henrique/opencode-hooks` | `npm install @johnatas-henrique/opencode-hooks` |
| B) Outro nome                       | `opencode-hooks-plugin`             | `npm install opencode-hooks-plugin`             |

Scoped packages são gratuitos, não competem por nome global, e já refletem o autor.

---

## Passo 2: Ajustar `package.json`

Campos a adicionar/corrigir:

```json
{
  "name": "@johnatas-henrique/opencode-hooks",
  "version": "0.6.0",
  "main": "./dist/.opencode/plugins/opencode-hooks.js",
  "types": "./dist/.opencode/plugins/opencode-hooks.d.ts",
  "files": ["dist/", "README.md", "LICENSE"],
  "publishConfig": { "access": "public" },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/johnatas-henrique/opencode-hooks.git"
  },
  "homepage": "https://github.com/johnatas-henrique/opencode-hooks#readme",
  "bugs": {
    "url": "https://github.com/johnatas-henrique/opencode-hooks/issues"
  },
  "scripts": {
    "prepublishOnly": "npm run build"
  }
}
```

---

## Passo 3: Atualizar `.npmignore` ou `files`

O campo `"files"` no `package.json` é mais explícito que `.npmignore`. Recomendo usar `"files"` e remover `.npmignore`.

Isso garante que **só** `dist/`, `README.md`, e `LICENSE` vão pro NPM.

---

## Passo 4: Publicar manualmente

```bash
npm run build
npm publish --access public
```

---

## Passo 5: Automatizar via Release Please (CI)

Adicionar ao workflow do GitHub Actions (`.github/workflows/release.yml`):

```yaml
- name: Publish to npm
  run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Configurar `NPM_TOKEN` no GitHub: npmjs.com → Access Tokens → Automation token → Settings → Secrets and variables → Actions.

---

## Resumo

| #   | Ação                              | Comando/Onde                                                             |
| --- | --------------------------------- | ------------------------------------------------------------------------ |
| 1   | Criar conta npmjs.com             | https://www.npmjs.com/signup                                             |
| 2   | `npm login` no terminal           | `npm login`                                                              |
| 3   | Decidir nome                      | Sugiro `@johnatas-henrique/opencode-hooks`                               |
| 4   | Atualizar `package.json`          | `name`, `main`, `types`, `files`, `publishConfig`, `repository`, scripts |
| 5   | Adicionar `prepublishOnly` script | `"prepublishOnly": "npm run build"`                                      |
| 6   | (Opcional) CI automation          | GitHub Secrets + workflow step                                           |
| 7   | Publicar                          | `npm publish --access public`                                            |
| 8   | Instalar em outro projeto         | `npm install @johnatas-henrique/opencode-hooks`                          |
