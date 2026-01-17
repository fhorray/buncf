
import { type BunPlugin } from "bun";
import * as fs from "fs";
import * as path from "path";

// Function to read the runtime code relative to this file
function getRuntimeCode() {
  const extensions = ["js", "ts"];
  for (const ext of extensions) {
    try {
      const runtimePath = path.join(import.meta.dir, `runtime.${ext}`);

      // Check if runtime exists
      if (!fs.existsSync(runtimePath)) continue;

      let runtimeCode = fs.readFileSync(runtimePath, "utf-8");

      // Pre-process RUNTIME (Remove imports)
      if (runtimeCode.includes("// --- BUN-CF-ADAPTER RUNTIME")) {
        const parts = runtimeCode.split("// --- BUN-CF-ADAPTER RUNTIME");
        if (parts.length > 1) {
          runtimeCode = "// --- BUN-CF-ADAPTER RUNTIME" + parts[1];
        }
      }

      // Rewrite runtime to use "buncf" imports instead of relative
      // Rewrite runtime to use "buncf" imports instead of relative
      // We handle both exact string match and regex for safety
      if (runtimeCode.includes("import { runWithCloudflareContext } from './context';")) {
        runtimeCode = runtimeCode.replace("import { runWithCloudflareContext } from './context';", 'import { runWithCloudflareContext } from "buncf";');
      } else {
        runtimeCode = `import { runWithCloudflareContext } from "buncf";\n` + runtimeCode;
      }

      // Clean up other potential imports
      runtimeCode = runtimeCode
        .replace(/import\s+\{\s*runWithCloudflareContext\s*\}\s+from\s+['"]\.\/context['"];?/g, "") // remove if still there
        .replace(/import\s+(?:type\s+)?\{[\s\S]*?\}\s+from\s+['"]\.\/types['"];?/g, "");

      return `
// --- INJECTED RUNTIME ---
${runtimeCode}
      `;
    } catch (e) {
      console.error(e);
      continue;
    }
  }

  console.error("❌ [buncf] CRITICAL: Could not find runtime.ts or runtime.js");
  throw new Error("Buncf runtime files missing");
}

export const bunToCloudflare = (entrypointPath?: string): BunPlugin => ({
  name: "bun-to-cloudflare",
  setup(build) {
    const runtimeCode = getRuntimeCode();
    const absoluteEntryPath = entrypointPath ? path.resolve(process.cwd(), entrypointPath) : null;

    // Scan for API & Page Routes ONCE per build
    let injectedRoutesCode = "";
    try {
      const apiDir = path.resolve(process.cwd(), "src/api");
      if (fs.existsSync(apiDir)) {
        const router = new Bun.FileSystemRouter({ dir: apiDir, style: "nextjs" });
        const routeEntries = Object.entries(router.routes).map(([route, filePath]) => {
          const importPath = filePath.split(path.sep).join(path.posix.sep);
          return `"${route}": () => import("${importPath}")`;
        });

        let pagesRouteEntries: string[] = [];
        try {
          const pagesDir = path.resolve(process.cwd(), "src/pages");
          if (fs.existsSync(pagesDir)) {
            const pagesRouter = new Bun.FileSystemRouter({ dir: pagesDir, style: "nextjs" });
            pagesRouteEntries = Object.entries(pagesRouter.routes).map(([route, filePath]) => {
              return `"${route}": () => new Response(__INDEX_HTML_CONTENT__, { headers: { "Content-Type": "text/html" } })`;
            });
            console.log(`[buncf] Found ${pagesRouteEntries.length} Page routes`);
          }
        } catch (e) {
          console.error("Failed to scan Page routes:", e);
        }

        let indexHtmlContent = "";
        const indexCandidates = ["src/index.html", "index.html"];
        for (const cand of indexCandidates) {
          const p = path.resolve(process.cwd(), cand);
          if (fs.existsSync(p)) {
            indexHtmlContent = fs.readFileSync(p, "utf-8")
              .replace(/src=["'](?:\.?\/)?(.*)\.tsx["']/g, 'src="/$1.js"')
              .replace(/src=["'](?:\.?\/)?(.*)\.ts["']/g, 'src="/$1.js"')
              .replace(/src=["'](?:\.?\/)?(.*)\.jsx["']/g, 'src="/$1.js"')
              .replace(/href=["'](?:\.?\/)?(.*)\.css["']/g, 'href="/$1.css"')
              .replace(/src=["']\.\/(.*)["']/g, 'src="/$1"')
              .replace(/href=["']\.\/(.*)["']/g, 'href="/$1"')
              .replace(/`/g, "\\`").replace(/\${/g, "\\${");
            break;
          }
        }

        injectedRoutesCode = `
// --- INJECTED STATIC ROUTES ---
const __STATIC_API_ROUTES__ = {
  ${routeEntries.join(",\n  ")}
};
const __STATIC_PAGES_ROUTES__ = {
  ${pagesRouteEntries.join(",\n  ")}
};
const __INDEX_HTML_CONTENT__ = \`${indexHtmlContent}\`;
`;
      }
    } catch (e) {
      console.error("Failed to scan routes during setup:", e);
    }

    // 1. Mock Dev Module for Production (Strip Miniflare)
    build.onLoad({ filter: /dev\.ts$/ }, (args) => {
      const normalizedPath = args.path.replace(/\\/g, '/');
      if (normalizedPath.endsWith("packages/buncf/src/dev.ts") || normalizedPath.endsWith("buncf/src/dev.ts")) {
        return {
          contents: "export const initBuncfDev = async () => {}; export const getDevContext = () => null; export const waitForDevContext = async () => null;",
          loader: "ts"
        };
      }
      return undefined;
    });

    // 2. Wrap User Entry Point
    build.onLoad({ filter: /\.(ts|js|tsx|jsx)$/ }, async (args) => {
      const normalizedPath = path.resolve(args.path);
      const isEntry = absoluteEntryPath === normalizedPath;

      if (!isEntry) return undefined;

      let originalCode = await Bun.file(args.path).text();
      const loader = args.path.endsWith("sx") ? "tsx" : "ts";

      // Prepare code injection
      const runtimeNoExport = runtimeCode.replace("export default", "const __worker_export__ =");

      // Handle user's createApp call and export
      let processedCode = originalCode;
      if (processedCode.includes("createApp")) {
        processedCode = processedCode
          .replace(/createApp\s*\(\s*\{/g, 'createApp({ staticRoutes: { api: __STATIC_API_ROUTES__, pages: __STATIC_PAGES_ROUTES__ }, indexHtmlContent: __INDEX_HTML_CONTENT__, ')
          .replace(/createApp\s*\(\s*\)/g, 'createApp({ staticRoutes: { api: __STATIC_API_ROUTES__, pages: __STATIC_PAGES_ROUTES__ }, indexHtmlContent: __INDEX_HTML_CONTENT__ })');
      }

      // Handle Bun shimming
      processedCode = processedCode
        .replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s*["']bun["'];?/g, "const { $1 } = __BunShim__;")
        .replace(/import\s+Bun\s+from\s*["']bun["'];?/g, "const Bun = __BunShim__;")
        .replace(/import\s+\*\s+as\s+Bun\s+from\s*["']bun["'];?/g, "const Bun = __BunShim__;");

      // Replace user's export default to avoid syntax error (duplicate export)
      processedCode = processedCode.replace(/export\s+default/g, "const __user_export__ =");

      const combinedCode = `
// --- ADAPTER RUNTIME START ---
${runtimeNoExport}
// --- ADAPTER RUNTIME END ---

${injectedRoutesCode}

// --- USER CODE START ---
${processedCode}
// --- USER CODE END ---

// --- EXPORT FOR WORKER ---
export default {
    async fetch(request, env, ctx) {
        // Sync Env to Process (Polyfill)
        if (typeof process === "undefined") globalThis.process = { env: {} } as any;
        if (!process.env) process.env = {};
        
        const stringEnv = {};
        for (const key in env) {
             if (typeof env[key] === 'string') {
                 stringEnv[key] = env[key];
                 process.env[key] = env[key];
             }
        }
        
        if (typeof __BunShim__ !== "undefined") {
            __BunShim__.env = stringEnv;
            if (env.ASSETS) (__BunShim__ as any).ASSETS = env.ASSETS;
        }

        // If user didn't have an export default, fallback to runtime export
        const handler = typeof __user_export__ !== 'undefined' ? __user_export__ : __worker_export__;
        return handler.fetch(request, env, ctx);
    }
};
`;

      return {
        contents: combinedCode,
        loader,
      };
    });
  },
});
