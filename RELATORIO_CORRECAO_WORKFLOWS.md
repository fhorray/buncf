# Troubleshooting: Cloudflare Context & Workflows

Este documento detalha os problemas identificados e as soluções implementadas para garantir o funcionamento correto do `CloudflareContext` e dos `Workflows` no framework Buncf, tanto em ambiente de desenvolvimento quanto em produção.

## 1. Problemas Identificados

### A. Falha na Inicialização de Bindings de Workflow (`dev.ts`)

No ambiente de desenvolvimento, o buncf não conseguia identificar os bindings de Workflow se estivessem configurados em arquivos `wrangler.jsonc`. Além disso, o carregamento das classes de workflow a partir dos arquivos fonte gerava conflitos de resolução do pacote `cloudflare:workers`.

### B. Erro `CloudflareContext not initialized` em Produção

O erro ocorria principalmente em Cloudflare Workers em produção. O `AsyncLocalStorage` (usado para isolar o contexto de cada request) nem sempre propaga o estado corretamente nesse ambiente, resultando no erro fatal ao tentar acessar bindings (como `env.ASSETS` ou `env.MY_WORKFLOW`).

### C. Cache de Build de Workspaces

O Bun pode manter versões antigas de pacotes locais (`workspace:*`) em cache, fazendo com que mudanças no código do framework (`packages/buncf`) não sejam refletidas imediatamente no bundle final da aplicação (`apps/playground`).

---

## 2. Mudanças Implementadas

### Framework (`packages/buncf`)

#### [MODIFY] [`dev.ts`](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/dev.ts)

- Adicionado suporte para leitura de `wrangler.jsonc` na detecção de bindings de workflow.
- Alterada a lógica de carregamento dos Workflows para usar o bundle gerado em `.buncf/dev.js` ao invés dos arquivos `.ts` originais, garantindo compatibilidade com o plugin de resolução da Cloudflare.

#### [MODIFY] [`worker-factory.ts`](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/worker-factory.ts)

- Implementada a definição de variáveis globais `globalThis.__BUNCF_ENV__` e `globalThis.__BUNCF_CTX__` logo no início do fetch handler. Isso serve como um "seguro" caso o `AsyncLocalStorage` falhe.

#### [MODIFY] [`context.ts`](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/context.ts)

- Atualizada a função `getCloudflareContext()` para verificar as variáveis globais fallback se o `getStore()` do `AsyncLocalStorage` retornar `null`.
- **Nota de Segurança**: No Cloudflare Workers, cada request roda em um isolamento de execução (isolates), tornando seguro o uso de globais para o contexto da request atual.

#### [MODIFY] [`router/index.ts`](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/router/index.ts) e [`runtime.ts`](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/runtime.ts)

- Envolvidas todas as chamadas críticas ao `getCloudflareContext()` em blocos `try-catch`. Isso evita que a aplicação quebre em produção caso o contexto falhe em rotas de fallback (como o carregamento de assets estáticos).

---

## 3. Como Resolver Problemas de Build/Cache

Se você fizer mudanças no framework e elas não aparecerem no seu Worker após o deploy, siga estes passos:

1. **Limpe o cache local e compile do zero:**

   ```bash
   rm -rf .buncf
   bun install --force
   bun run build
   ```

2. **Verifique o bundle gerado:**
   Procure por strings específicas (como `__BUNCF_ENV__`) no arquivo `.buncf/cloudflare/worker.js` para confirmar que as alterações foram incluídas.

3. **Deploy limpo:**
   ```bash
   wrangler deploy
   ```

## 4. Exemplo de Workflow

Um exemplo funcional de Workflow foi criado em `apps/playground/src/workflows.ts`. Para testá-lo em produção:

1. Acesse `/workflow-test`.
2. Clique em "Iniciar Workflow".
3. Verifique o status em `/_buncf/workflows`.
