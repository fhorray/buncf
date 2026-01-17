
import { type BunPlugin } from "bun";
import * as fs from "fs";
import * as path from "path";

// Function to read the runtime code relative to this file
// Function to read the runtime code relative to this file
function getRuntimeCode() {
  const extensions = ["js", "ts"];
  for (const ext of extensions) {
    try {
      const runtimePath = path.join(import.meta.dir, `runtime.${ext}`);
      const typesPath = path.join(import.meta.dir, `types.${ext}`);

      // Check if runtime exists
      if (!fs.existsSync(runtimePath)) continue;

      let runtimeCode = fs.readFileSync(runtimePath, "utf-8");

      let typesCode = "";
      if (fs.existsSync(typesPath)) {
        typesCode = fs.readFileSync(typesPath, "utf-8");
      } else if (fs.existsSync(path.join(import.meta.dir, "types.d.ts"))) {
        typesCode = fs.readFileSync(path.join(import.meta.dir, "types.d.ts"), "utf-8");
      }

      // Pre-process TYPES
      const processedTypes = typesCode
        .replace(/export\s+/g, "")
        .replace(/declare\s+global\s*\{[\s\S]*?\}/g, "");
      const globalDecl = "declare var Bun: BunShimType;";

      // Pre-process RUNTIME
      if (runtimeCode.includes("// --- BUN-CF-ADAPTER RUNTIME")) {
        const parts = runtimeCode.split("// --- BUN-CF-ADAPTER RUNTIME");
        if (parts.length > 1) {
          runtimeCode = "// --- BUN-CF-ADAPTER RUNTIME" + parts[1];
        }
      } else {
        // Fallback or JS mode cleanup
        runtimeCode = runtimeCode.replace(/import\s+(?:type\s+)?\{[\s\S]*?\}\s+from\s+['"]\.\/types['"];?/g, "");
      }

      return `
// --- INJECTED TYPES ---
${processedTypes}
${globalDecl}

// --- INJECTED RUNTIME ---
${runtimeCode}
      `;
    } catch (e) {
      continue;
    }
  }

  console.error("❌ [buncf] CRITICAL: Could not find runtime.ts or runtime.js");
  return `export default { fetch: () => new Response("Error: Runtime missing", {status: 500}) }`;
}

export const bunToCloudflare = (): BunPlugin => ({
  name: "bun-to-cloudflare",
  setup(build) {
    const runtimeCode = getRuntimeCode();

    build.onLoad({ filter: /\.(ts|js|tsx|jsx)$/ }, async (args) => {
      let originalCode = await Bun.file(args.path).text();

      // Check if this file calls createApp (likely the entry point)
      let injectedRoutesCode = "";
      if (originalCode.includes("createApp")) {
        // Scan for API Routes
        try {
          const apiDir = path.resolve(process.cwd(), "src/api");
          if (fs.existsSync(apiDir)) {
            const router = new Bun.FileSystemRouter({
              dir: apiDir,
              style: "nextjs"
            });

            // Construct the static map: { "/api/hello": () => import(".../src/api/hello.ts") }
            const routeEntries = Object.entries(router.routes).map(([route, filePath]) => {
              // Ensure import path is relative or absolute compatible
              // Bun build handles absolute paths fine usually, or use relative to process.cwd()
              // Let's use absolute path for simplicity but ensure quotes are escaped
              // Note: router.routes keys are like "/api/hello" (if mounted at root?)
              // Bun.FileSystemRouter returns keys relative to dir??
              // Actually Bun.FileSystemRouter keys ALREADY include the structure derived from file path.
              // e.g. src/api/users/[id].ts -> "/users/[id]" or "/users/:id"

              // We need to prefix them with "/api" if that's what our router expects keys to be,
              // OR adapt the router to expect keys without prefix.
              // In api.ts, I assumed keys passed in `staticRoutes` match what `matchRoute` expects.
              // If `api.ts` strips `/api`, then it expects `/hello`.
              // Bun.FileSystemRouter ("nextjs" style) on "src/api" likely returns "/hello" for "src/api/hello.ts".
              // So the keys are perfect (without /api prefix).

              // IMPORTANT: Windows paths!
              const importPath = filePath.split(path.sep).join(path.posix.sep);
              return `"${route}": () => import("${importPath}")`;
            });

            // Scan for Pages Routes
            let pagesRouteEntries: string[] = [];
            try {
              const pagesDir = path.resolve(process.cwd(), "src/pages");
              if (fs.existsSync(pagesDir)) {
                const pagesRouter = new Bun.FileSystemRouter({
                  dir: pagesDir,
                  style: "nextjs"
                });
                pagesRouteEntries = Object.entries(pagesRouter.routes).map(([route, filePath]) => {
                  const importPath = filePath.split(path.sep).join(path.posix.sep);
                  return `"${route}": "${importPath}"`;
                });
                console.log(`[buncf] Found ${pagesRouteEntries.length} Page routes`);
              }
            } catch (e) { console.error("Failed to scan Page routes:", e); };

            // Read and inject index.html content (rewritten for production)
            let indexHtmlContent = "";
            let indexCandidates = ["src/index.html", "index.html"];
            // Use absolute paths
            for (const cand of indexCandidates) {
              const p = path.resolve(process.cwd(), cand);
              if (fs.existsSync(p)) {
                indexHtmlContent = fs.readFileSync(p, "utf-8");
                // Rewrite references for production (Force absolute paths)
                // 1. Scripts: .tsx, .ts, .jsx -> .js
                indexHtmlContent = indexHtmlContent
                  .replace(/src=["'](?:\.?\/)?(.*)\.tsx["']/g, 'src="/$1.js"')
                  .replace(/src=["'](?:\.?\/)?(.*)\.ts["']/g, 'src="/$1.js"')
                  .replace(/src=["'](?:\.?\/)?(.*)\.jsx["']/g, 'src="/$1.js"');

                // 2. Styles
                indexHtmlContent = indexHtmlContent.replace(/href=["'](?:\.?\/)?(.*)\.css["']/g, 'href="/$1.css"');

                // 3. General cleanup (relative src/href -> absolute)
                indexHtmlContent = indexHtmlContent
                  .replace(/src=["']\.\/(.*)["']/g, 'src="/$1"')
                  .replace(/href=["']\.\/(.*)["']/g, 'href="/$1"');

                // Escape backticks for injection template
                indexHtmlContent = indexHtmlContent.replace(/`/g, "\\`").replace(/\${/g, "\\${");
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
            // Inject into createApp call
            // 1. Handle arguments case first
            originalCode = originalCode.replace(/createApp\s*\(\s*\{/g, 'createApp({ staticRoutes: { api: __STATIC_API_ROUTES__, pages: __STATIC_PAGES_ROUTES__ }, indexHtmlContent: __INDEX_HTML_CONTENT__, ');

            // 2. Handle no-arguments case
            originalCode = originalCode.replace(/createApp\s*\(\s*\)/g, 'createApp({ staticRoutes: { api: __STATIC_API_ROUTES__, pages: __STATIC_PAGES_ROUTES__ }, indexHtmlContent: __INDEX_HTML_CONTENT__ })');

            // console.log(`[buncf] Injected ${routeEntries.length} API routes into ${args.path}`);
          }
        } catch (e) {
          console.error("Failed to scan API routes:", e);
        }
      }

      // Rewrite "import ... from 'bun'"
      originalCode = originalCode.replace(
        /import\s+\{\s*([^}]+)\s*\}\s+from\s*["']bun["'];?/g,
        "const { $1 } = __BunShim__;"
      );
      originalCode = originalCode.replace(
        /import\s+Bun\s+from\s*["']bun["'];?/g,
        "const Bun = __BunShim__;"
      );
      originalCode = originalCode.replace(
        /import\s+\*\s+as\s+Bun\s+from\s*["']bun["'];?/g,
        "const Bun = __BunShim__;"
      );

      const loader = args.path.endsWith("sx") ? "tsx" : "ts";

      // Only inject entry points that strictly use Bun.serve
      if (!originalCode.includes("Bun.serve") && !originalCode.includes("serve(")) {
        return { contents: originalCode, loader };
      }

      // Remove default export from runtime
      const runtimeNoExport = runtimeCode.replace("export default", "const __worker_export__ =");

      const combinedCode = `
// --- ADAPTER RUNTIME START ---
${runtimeNoExport}
// --- ADAPTER RUNTIME END ---

${injectedRoutesCode}

// --- USER CODE START ---
${originalCode}
// --- USER CODE END ---

// --- EXPORT FOR WORKER ---
export default __worker_export__;
`;

      return {
        contents: combinedCode,
        loader,
      };
    });
  },
});
