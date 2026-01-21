# Changelog: Workflow Integration Fixes

Este documento detalha todas as alterações feitas para resolver o erro de importação do [WorkflowEntrypoint](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/workflows/entrypoint.ts#3-16) e os problemas de roteamento do Dashboard de Workflows.

---

## 🎯 Problema Original

O usuário encontrou o erro:
```
Module '"cloudflare:workflows"' has no exported member 'WorkflowEntrypoint'.ts(2305)
```

---

## ✅ Alterações no Código

### 1. [apps/playground/src/workflows.ts](file:///Users/fhorray/Desktop/dev/JS/buncf/apps/playground/src/workflows.ts)

**Problema:** Import incorreto de `cloudflare:workflows`.

**Solução:**
```diff
-import { WorkflowEntrypoint, WorkflowStep, type WorkflowEvent } from 'cloudflare:workflows';
+import { WorkflowEntrypoint, type WorkflowStep, type WorkflowEvent } from 'cloudflare:workers';

-export class UserSignupWorkflow extends WorkflowEntrypoint<Env, Params> {
-  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
+export class UserSignupWorkflow extends WorkflowEntrypoint<CloudflareEnv, Params> {
+  override async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
```

---

### 2. [packages/buncf/src/plugin.ts](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/plugin.ts)

**Problema:** O Bun plugin não resolvia o módulo `cloudflare:workers`.

**Solução:**
```diff
-build.onResolve({ filter: /^cloudflare:workflows$/ }, async (args) => {
+build.onResolve({ filter: /^cloudflare:(workflows|workers)$/ }, async (args) => {
```

---

### 3. [packages/buncf/src/workflows/types.ts](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/workflows/types.ts)

**Problema:** Identificadores duplicados na interface [WorkflowStep](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/workflows/types.ts#39-45).

**Solução:**
```diff
 export interface WorkflowStep {
-  do: <T>(name: string, config: ...) => Promise<T>;
-  do: <T>(name: string, callback: ...) => Promise<T>;
+  do<T>(name: string, config: ..., callback: ...): Promise<T>;
+  do<T>(name: string, callback: ...): Promise<T>;
```

---

### 4. [packages/buncf/src/router/index.ts](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/router/index.ts)

**Problema:** O SPA catch-all interceptava rotas internas `/_buncf/*`.

**Solução 1:** Exemir `/_buncf/` do fallback SPA:
```diff
-if (indexHtmlContent && !url.pathname.includes(".")) {
+if (indexHtmlContent && !url.pathname.includes(".") && !url.pathname.startsWith("/_buncf/")) {
```

**Solução 2:** Adicionar fallback para `ASSETS.fetch` antes do 404:
```typescript
// 5. Try ASSETS binding as final fallback (for dev-only routes like /_buncf/*)
const cfContext = getCloudflareContext();
if (cfContext?.env?.ASSETS) {
  try {
    const assetRes = await cfContext.env.ASSETS.fetch(req);
    if (assetRes.status !== 404) {
      return assetRes;
    }
  } catch (e) {
    // Ignore errors, fall through to 404
  }
}
```

---

### 5. [packages/buncf/src/runtime.ts](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/runtime.ts)

**Problema:** O fallback SPA em [globalServeAsset](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/runtime.ts#29-111) também interceptava `/_buncf/*`.

**Solução:**
```diff
-if (res.status === 404 && !assetPath.startsWith("/api")) {
+if (res.status === 404 && !assetPath.startsWith("/api") && !assetPath.startsWith("/_buncf/")) {
```

**Adicional:** Fallback para [globalServeAsset](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/runtime.ts#29-111) em [createFetchFromRoutes](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/runtime.ts#114-216):
```typescript
// Default: try assets as a final fallback
const assetResponse = await globalServeAsset(req, options.assetPrefix);
if (assetResponse) return assetResponse;
```

---

### 6. [packages/buncf/src/dev.ts](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/dev.ts)

**Melhoria:** Adicionado tratamento de erros e logs no polyfill do `ASSETS.fetch`:
```typescript
try {
  // Intercept Workflow API and UI requests
  if (url.pathname.startsWith("/_buncf/workflows")) {
    // ... existing logic with try/catch ...
  }
} catch (e: any) {
  console.error("[Buncf Dev] ASSETS.fetch intercept error:", e.message);
}
```

---

### 7. [packages/buncf/src/workflows/README.md](file:///Users/fhorray/Desktop/dev/JS/buncf/packages/buncf/src/workflows/README.md)

**Problema:** Documentação desatualizada.

**Solução:** README completamente reescrito com:
- Estrutura clara e organizada
- Código de exemplo atualizado para `cloudflare:workers`
- Uso de [CloudflareEnv](file:///Users/fhorray/Desktop/dev/JS/buncf/apps/playground/cloudflare-env.d.ts#14-15) e `override`
- Seção de Dicas e Melhores Práticas

---

## 📊 Resumo das Tentativas

| Tentativa | Resultado |
|-----------|-----------|
| 1. Corrigir import para `cloudflare:workers` | ✅ Resolveu erro de TypeScript |
| 2. Adicionar regex no plugin para `cloudflare:workers` | ✅ Resolveu erro de build |
| 3. Exemir `/_buncf/` do SPA catch-all no router | ⚠️ Parcial - ainda 404 |
| 4. Exemir `/_buncf/` do SPA fallback no runtime | ⚠️ Parcial - ainda 404 |
| 5. Adicionar fallback `ASSETS.fetch` no router | ✅ Dashboard funcionando! |
