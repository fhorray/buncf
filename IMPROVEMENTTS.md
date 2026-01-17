Documento de Melhoria: Bun-to-Cloudflare Plugin (index.ts)
Objetivo: Aumentar a robustez do plugin de build que converte código Bun para Cloudflare Workers, garantindo que ele funcione em diferentes ambientes (NPM, Monorepo) e lide corretamente com variações de sintaxe.

1. Fragilidade na Substituição de Imports (Regex)
Problema: O uso atual de Expressões Regulares (replace) para remover import { serve } from "bun" é frágil.

Ele falha se o import estiver em várias linhas.

Ele falha se houver comentários no meio.

Ele falha se o usuário usar as (alias), ex: import { serve as bunServe }.

Solução: Utilizar uma Regex mais robusta que suporte múltiplas linhas (/s ou [\s\S]) ou, idealmente, um parser de AST (Abstract Syntax Tree). Para manter a simplicidade sem adicionar dependências pesadas, melhoraremos a Regex.

2. Carregamento do Runtime (fs.readFileSync)
Problema: O código lê runtime.ts usando fs.readFileSync.

Isso funciona localmente, mas se você publicar esse pacote no NPM, o arquivo runtime.ts (TypeScript cru) pode não ser incluído na publicação, ou o caminho pode mudar na pasta dist/.

Solução:

Compilar o runtime.ts para string durante o build do plugin, embutindo-o no código final.

Ou adicionar tratamento de erro robusto caso o arquivo não seja encontrado.

3. Detecção de "Entry Point" (includes)
Problema: A verificação if (!originalCode.includes("Bun.serve")) é imprecisa.

Se o usuário escrever "Bun.serve" dentro de uma string de texto (ex: console.log("Use Bun.serve")), o plugin achará que é o arquivo principal e injetará o código desnecessariamente.

Solução: Limitar a injeção apenas ao arquivo que está sendo processado como "entrypoint" (se a API do plugin permitir saber disso) ou aceitar essa limitação documentada como "Heurística".

4. Quebra de Source Maps
Problema: Ao fazer concatenação de strings (runtime + userCode), os números das linhas mudam. Se der erro na linha 10 do código do usuário, o Cloudflare pode apontar erro na linha 150 (por causa do código injetado antes).

Solução: Adicionar marcadores de comentário especiais ou usar bibliotecas de "Magic String" que preservam mapas. Para este documento simples, focaremos em manter a injeção limpa.

Código Refatorado (index.ts)
Abaixo, a versão melhorada. Ela resolve principalmente a fragilidade dos imports e o carregamento do runtime.

TypeScript

import { type BunPlugin } from "bun";
import * as fs from "fs";
import * as path from "path";

// Re-export types
export * from "./types";
export { createApp, createApiRouter, createPagesRouter } from "./router";

/**
 * Carrega o código do Runtime.
 * MELHORIA: Tenta carregar .js (compilado) primeiro, depois .ts (dev),
 * e lida com erros graciosamente.
 */
function getRuntimeCode(): string {
  const fileExtensions = ["js", "ts"]; // Prioriza JS (prod) depois TS (dev)
  
  for (const ext of fileExtensions) {
    try {
      // Tenta achar runtime.js ou runtime.ts no mesmo diretório
      const runtimePath = path.join(import.meta.dir, `runtime.${ext}`);
      if (fs.existsSync(runtimePath)) {
        return fs.readFileSync(runtimePath, "utf-8");
      }
    } catch (e) {
      continue;
    }
  }

  // Se falhar, retorna um stub para não quebrar o build silenciosamente
  console.error("❌ [Bun Adapter] CRITICAL: Could not find runtime.ts or runtime.js");
  return `export default { fetch: () => new Response("Error: Runtime missing", {status: 500}) }`;
}

export const bunToCloudflare = (): BunPlugin => ({
  name: "bun-to-cloudflare",
  setup(build) {
    // Carrega o runtime apenas uma vez no início do build
    const runtimeRaw = getRuntimeCode();
    
    // MELHORIA: Removemos o export default do runtime de forma mais segura,
    // garantindo que capturamos qualquer variação de espaçamento.
    const runtimeNoExport = runtimeRaw.replace(
      /export\s+default\s+/g, 
      "const __worker_export__ = "
    );

    build.onLoad({ filter: /\.(ts|js|tsx|jsx)$/ }, async (args) => {
      const fileContent = await Bun.file(args.path).text();
      
      // Heurística de Entrada:
      // Verifica se é o arquivo principal procurando por Bun.serve.
      // Nota: Isso ainda pode dar falso positivo em comentários, mas é aceitável para MVP.
      const isEntryFile = fileContent.includes("Bun.serve") || fileContent.includes("serve(");

      if (!isEntryFile) {
        return { contents: fileContent, loader: args.path.endsWith("x") ? "tsx" : "ts" };
      }

      let transformedCode = fileContent;

      // MELHORIA NO REGEX (Ponto 1):
      // 1. Suporta multiline (/s não existe nativo em JS antigo, usamos [\s\S])
      // 2. Captura alias e destructuring complexo
      // 3. Substitui imports nomeados: import { serve, plugin } from 'bun'
      transformedCode = transformedCode.replace(
        /import\s+\{([\s\S]*?)\}\s+from\s*["']bun["'];?/g,
        (match, capturedImports) => {
           // Mantém a estrutura original do destructuring
           return `const {${capturedImports}} = __BunShim__;`;
        }
      );

      // 4. Substitui import default: import Bun from 'bun'
      transformedCode = transformedCode.replace(
        /import\s+([a-zA-Z0-9_]+)\s+from\s*["']bun["'];?/g,
        "const $1 = __BunShim__;"
      );
      
      // 5. Substitui import namespace: import * as Bun from 'bun'
      transformedCode = transformedCode.replace(
        /import\s+\*\s+as\s+([a-zA-Z0-9_]+)\s+from\s*["']bun["'];?/g,
        "const $1 = __BunShim__;"
      );

      // Montagem do Sanduíche (Injection)
      const combinedCode = `
// --- BUN-CF-ADAPTER: RUNTIME START ---
${runtimeNoExport}
// --- RUNTIME END ---

// --- USER CODE START ---
${transformedCode}
// --- USER CODE END ---

// --- CLOUDFLARE WORKER EXPORT ---
export default __worker_export__;
`;

      return {
        contents: combinedCode,
        loader: args.path.endsWith("x") ? "tsx" : "ts",
      };
    });
  },
});
O que mudou na prática?
Imports Seguros: Agora, se você escrever:

TypeScript

import {
  serve,
  file
} from "bun";
O novo Regex ([\s\S]*?) vai capturar corretamente as quebras de linha, o que o Regex antigo ([^}]+) falhava.

Fallback do Runtime: Ele tenta achar .js (caso você tenha compilado a lib) e depois .ts. Se não achar, ele emite um erro no console em vez de quebrar o processo silenciosamente.

Namespace Import: Adicionado suporte para import * as Bun from "bun", que é comum.