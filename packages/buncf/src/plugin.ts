
import { type BunPlugin } from "bun";
import * as path from "path";
import * as fs from "fs";

// Helper to read runtime code
async function getRuntimeCode() {
  const extensions = ["ts", "js"];
  for (const ext of extensions) {
    const runtimePath = path.join(import.meta.dir, `runtime.${ext}`);
    const file = Bun.file(runtimePath);
    if (await file.exists()) {
      let code = await file.text();

      // Replace relative imports for runtime injection
      code = code.replace(/from\s+['"]\.\/(context|types)['"];?/g, 'from "buncf";');

      return `
// --- INJECTED RUNTIME (${ext}) ---
${code}
`;
    }
  }
  throw new Error("Buncf runtime file not found");
}

export const bunToCloudflare = (entrypointPath?: string): BunPlugin => ({
  name: "bun-to-cloudflare",
  setup(build) {
    const absoluteEntryPath = entrypointPath ? path.resolve(process.cwd(), entrypointPath) : null;

    // 1. Mock Dev Module
    build.onLoad({ filter: /dev\.ts$/ }, (args) => {
      // Normalize both paths for comparison
      const argPath = path.resolve(args.path);
      const devPath = path.resolve(import.meta.dir, "dev.ts");

      if (argPath === devPath) {
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
      const isEntry = absoluteEntryPath &&
        (process.platform === 'win32'
          ? absoluteEntryPath.toLowerCase() === normalizedPath.toLowerCase()
          : absoluteEntryPath === normalizedPath);

      if (!isEntry) return undefined;

      const [runtimeCode, originalCode] = await Promise.all([
        getRuntimeCode(),
        Bun.file(args.path).text()
      ]);

      const loader = args.path.endsWith("sx") ? "tsx" : "ts";

      // Prepare Injections
      const runtimeNoExport = runtimeCode.replace("export default", "const __worker_export__ =");

      // Inject Constants (Static Routes)
      let injectedRoutesCode = "";
      try {
        const apiDir = path.resolve(process.cwd(), "src/api");
        const apiRoutes = fs.existsSync(apiDir)
          ? Object.entries(new Bun.FileSystemRouter({ dir: apiDir, style: "nextjs" }).routes)
            .map(([r, f]) => {
              const entryDir = path.dirname(args.path);
              const relPath = "./" + path.relative(entryDir, f).split(path.sep).join(path.posix.sep);
              // Security: JSON.stringify preventing code injection via filenames
              return `${JSON.stringify(r)}: () => import(${JSON.stringify(relPath)})`;
            })
          : [];

        const pagesDir = path.resolve(process.cwd(), "src/pages");
        const pageRoutes = fs.existsSync(pagesDir)
          ? Object.entries(new Bun.FileSystemRouter({ dir: pagesDir, style: "nextjs" }).routes)
            // Security: JSON.stringify route key
            .map(([r, _]) => `${JSON.stringify(r)}: () => new Response(__INDEX_HTML_CONTENT__, { headers: { "Content-Type": "text/html" } })`)
          : [];

        // Manual injection of special pages (_error, _loading, _notfound)
        const specialPages = ["_error", "_loading", "_notfound"];
        for (const page of specialPages) {
          // efficient search for extensions
          let ext = ["tsx", "jsx", "ts", "js"].find(e => fs.existsSync(path.join(pagesDir, `${page}.${e}`)));
          if (!ext) {
            const srcDir = path.resolve(process.cwd(), "src");
            ext = ["tsx", "jsx", "ts", "js"].find(e => fs.existsSync(path.join(srcDir, `${page}.${e}`)));
          }

          if (ext) {
            // Add as a known route key, e.g. "/_error"
            pageRoutes.push(`"/${page}": () => new Response(__INDEX_HTML_CONTENT__, { headers: { "Content-Type": "text/html" } })`);
          }
        }

        // Layouts Scanning (Recursive)
        const layoutRoutes: string[] = [];
        if (fs.existsSync(pagesDir)) {
          const scanLayouts = (dir: string, baseRoute: string) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
              const fullPath = path.join(dir, file);
              const stat = fs.statSync(fullPath);
              if (stat.isDirectory()) {
                scanLayouts(fullPath, `${baseRoute}/${file}`);
              } else if (file.match(/^_layout\.(tsx|jsx|ts|js)$/)) {
                // Found a layout!
                // Calculate route key from directory structure
                // e.g. src/pages/_layout.tsx -> "/"
                // src/pages/dashboard/_layout.tsx -> "/dashboard"
                let routeKey = baseRoute === "" ? "/" : baseRoute;
                // Normalize
                if (!routeKey.startsWith("/")) routeKey = "/" + routeKey;

                const entryDir = path.dirname(args.path);
                const relPath = "./" + path.relative(entryDir, fullPath).split(path.sep).join(path.posix.sep);

                // Security: JSON.stringify route key & value
                layoutRoutes.push(`${JSON.stringify(routeKey)}: () => import(${JSON.stringify(relPath)})`);
              }
            }
          };
          scanLayouts(pagesDir, "");
        }

        // Get Index HTML
        let indexHtml = "";
        const potentialIndices = ["src/index.html", "index.html", "public/index.html"];
        for (const p of potentialIndices) {
          const file = Bun.file(path.resolve(process.cwd(), p));
          if (await file.exists()) {
            let text = await file.text();
            // Basic transforms
            text = text
              .replace(/src=["'](?:\.?\/)?(.*)\.tsx["']/g, 'src="/$1.js"')
              .replace(/src=["'](?:\.?\/)?(.*)\.ts["']/g, 'src="/$1.js"')
              .replace(/src=["'](?:\.?\/)?(.*)\.jsx["']/g, 'src="/$1.js"')
              .replace(/href=["'](?:\.?\/)?(.*)\.css["']/g, 'href="/$1.css"')
              .replace(/src=["']\.\/(.*)["']/g, 'src="/$1"')
              .replace(/href=["']\.\/(.*)["']/g, 'href="/$1"');
            // Escape for template literal
            indexHtml = text.replace(/`/g, "\\`").replace(/\${/g, "\\${");
            break;
          }
        }

        injectedRoutesCode = `
const __STATIC_API_ROUTES__ = { ${apiRoutes.join(",")} };
const __STATIC_PAGES_ROUTES__ = { ${pageRoutes.join(",")} };
const __STATIC_LAYOUTS_ROUTES__ = { ${layoutRoutes.join(",")} };
const __INDEX_HTML_CONTENT__ = \`${indexHtml}\`;
`;
      } catch (e) {
        console.error("Route injection failed", e);
      }

      // Transform User Code
      let processedCode = originalCode;

      // Inject Routes into createApp
      const createAppRegex = /createApp\s*\(\s*(\{?)/;
      processedCode = processedCode.replace(createAppRegex, (match, brace) => {
        if (brace) return `createApp({ staticRoutes: { api: __STATIC_API_ROUTES__, pages: __STATIC_PAGES_ROUTES__, layouts: __STATIC_LAYOUTS_ROUTES__ }, indexHtmlContent: __INDEX_HTML_CONTENT__, `;
        return `createApp({ staticRoutes: { api: __STATIC_API_ROUTES__, pages: __STATIC_PAGES_ROUTES__, layouts: __STATIC_LAYOUTS_ROUTES__ }, indexHtmlContent: __INDEX_HTML_CONTENT__ }`;
      });

      // Shim Bun Imports
      processedCode = processedCode
        .replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s*["']bun["'];?/g, "const { $1 } = __BunShim__;")
        .replace(/import\s+(?:\*\s+as\s+)?Bun\s+from\s*["']bun["'];?/g, "const Bun = __BunShim__;");

      // Handle User Export Default
      processedCode = processedCode.replace(/export\s+default/g, "const __user_export__ =");

      // Middleware Detection
      let middlewareImportCode = "";
      const middlewareExtensions = ["ts", "js", "tsx", "jsx"];
      for (const ext of middlewareExtensions) {
        const middlewarePath = path.resolve(process.cwd(), `src/middleware.${ext}`);
        if (fs.existsSync(middlewarePath)) {
          const entryDir = path.dirname(args.path);
          const relPath = "./" + path.relative(entryDir, middlewarePath).split(path.sep).join(path.posix.sep);
          middlewareImportCode = `import __middleware_stack__ from "${relPath}";`;
          break;
        }
      }

      const combinedCode = `
${runtimeNoExport}
${injectedRoutesCode}
${middlewareImportCode}
// --- USER CODE ---
${processedCode}

// --- MIDDLEWARE PRE-COMPILATION ---
const __MIDDLEWARE_CACHE__ = (typeof __middleware_stack__ !== "undefined" && Array.isArray(__middleware_stack__))
    ? __middleware_stack__.map(m => ({
        handler: m.handler,
        patterns: m.matcher 
        ? (Array.isArray(m.matcher) ? m.matcher : [m.matcher]).map(p => {
             // Assume string patterns are for pathname matching
             // We use { pathname: p } to allow origin-agnostic matching
             try { return new URLPattern({ pathname: p }); } catch(e) { return null; }
          }).filter(Boolean)
        : null
    }))
    : [];

// --- WORKER EXPORT ---
export default {
    async fetch(request, env, ctx) {
        // Sync Env
        if (typeof process === "undefined") globalThis.process = { env: {} };
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
            if (env.ASSETS) __BunShim__.ASSETS = env.ASSETS;
        }

        // Priority: User Custom Handler > Buncf Runtime Handler
        const handler = typeof __user_export__ !== 'undefined' ? __user_export__ : __worker_export__;

         // Final Handler Wrapper
        const finalHandler = async () => {
             if (handler && typeof handler.fetch === 'function') {
                return handler.fetch(request, env, ctx);
            }
            return new Response("Entrypoint error: No fetch handler found.", { status: 500 });
        };

        // --- MIDDLEWARE RUNNER ---
        // Access the pre-compiled stack injected below
        if (typeof __MIDDLEWARE_CACHE__ !== "undefined") {
            let index = -1;
            const dispatch = async (i) => {
                if (i <= index) throw new Error("next() called multiple times");
                index = i;
                
                const item = __MIDDLEWARE_CACHE__[i];
                if (!item) return finalHandler();
                
                let matched = true;
                if (item.patterns) {
                   const urlObj = new URL(request.url); 
                   // Test against pathname specifically for performance and origin-agnosticism
                   matched = item.patterns.some(p => p.test({ pathname: urlObj.pathname }));
                }
                
                if (!matched) return dispatch(i + 1);
                
                return item.handler(request, () => dispatch(i + 1));
            };
            
            // Wrap Middleware execution in Context
            return runWithCloudflareContext({ env, ctx, cf: (request.cf || {}) }, () => dispatch(0));
        }

        // Wrap Direct Handler execution in Context
        return runWithCloudflareContext({ env, ctx, cf: (request.cf || {}) }, () => finalHandler());
    }
};
`;
      return {
        contents: combinedCode,
        loader
      };
    });
  }
});
