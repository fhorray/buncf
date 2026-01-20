import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { generateAllApiTypes } from "../codegen";
import { generateCloudflareTypes } from "../utils/typegen";
// @ts-ignore
import { bunToCloudflare } from "../plugin";
// @ts-ignore
import { log, colors } from "../utils/log";
import { serverActionsClientPlugin, serverActionsWorkerPlugin, deduplicateReactPlugin } from "../plugins/server-actions";
import { loadConfig } from "../utils/config";

function showBanner() {
  console.log(colors.cyan(`
   __                            ___ 
  |  |--.--.--.-----..----.----.|  _|
  |  _  |  |  |     ||  __|  __||  _|
  |_____|_____|__|__||____|____||_|  vDEV
  ${colors.dim("Build & Deploy Bun to Cloudflare Workers")}
`));
}

// Helper to generate client routes manifest
async function generateRoutesManifest() {
  try {
    const pagesDir = path.resolve(process.cwd(), "src/pages");
    if (!fs.existsSync(pagesDir)) { return; }
    const glob = new Bun.Glob("**/*.{tsx,jsx,ts,js}");
    const files = Array.from(glob.scanSync({ cwd: pagesDir, onlyFiles: true }));
    const routeEntries = files.map((file) => {
      const absFile = path.resolve(pagesDir, file);
      let routePath = file.replace(/\.(tsx|jsx|ts|js)$/, "");
      if (routePath.endsWith("index")) routePath = routePath.slice(0, -5);
      if (routePath.endsWith("/")) routePath = routePath.slice(0, -1);
      routePath = "/" + routePath.split(path.sep).join("/");
      if (routePath === "") routePath = "/";
      if (routePath.length > 1 && routePath.endsWith("/")) routePath = routePath.slice(0, -1);
      routePath = routePath.replace(/\/+/g, "/");

      const relPath = path.relative(".buncf", absFile).split(path.sep).join(path.posix.sep);
      const importPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
      return `  "${routePath}": () => import("${importPath}")`;
    });

    const specialPages = ["_error", "_loading", "_notfound"];
    for (const page of specialPages) {
      let ext = ["tsx", "jsx", "ts", "js"].find(e => fs.existsSync(path.join(pagesDir, `${page}.${e}`)));
      let searchDir = pagesDir;

      if (!ext) {
        const srcDir = path.resolve(process.cwd(), "src");
        ext = ["tsx", "jsx", "ts", "js"].find(e => fs.existsSync(path.join(srcDir, `${page}.${e}`)));
        if (ext) searchDir = srcDir;
      }

      if (ext) {
        const fullPath = path.join(searchDir, `${page}.${ext}`);
        const relPath = path.relative(path.resolve(".buncf"), fullPath).split(path.sep).join(path.posix.sep);
        const importPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
        routeEntries.push(`  "/${page}": () => import("${importPath}")`);
      }
    }

    const layoutEntries: string[] = [];
    if (fs.existsSync(pagesDir)) {
      const scanLayouts = (dir: string, baseRoute: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanLayouts(fullPath, `${baseRoute}/${file}`);
          } else if (file.match(/^_layout\.(tsx|jsx|ts|js)$/)) {
            let routeKey = baseRoute === "" ? "/" : baseRoute;
            if (!routeKey.startsWith("/")) routeKey = "/" + routeKey;

            const relPath = path.relative(path.resolve(".buncf"), fullPath).split(path.sep).join(path.posix.sep);
            const importPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
            layoutEntries.push(`  "${routeKey}": () => import("${importPath}")`);
          }
        }
      };
      scanLayouts(pagesDir, "");
    }

    const routesContent = `
import { type ComponentType } from "react";
export const routes: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
${routeEntries.join(",\n")}
};
export const layouts: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
${layoutEntries.join(",\n")}
};

declare module "buncf" {
  interface BuncfTypeRegistry {
    routes: {
${routeEntries.map(e => e.split(":")[0]).filter(key => !key?.includes("[")).map(key => `      ${key}: true;`).join("\n")}
    };
  }
}
`;
    if (!fs.existsSync(".buncf")) fs.mkdirSync(".buncf");
    await Bun.write(".buncf/routes.ts", routesContent);
  } catch (e) {
    console.error("Failed to generate routes manifest (dev):", e);
  }
}


export async function dev(entrypoint: string, flags: { verbose?: boolean, remote?: boolean } = {}) {
  console.clear();
  showBanner();
  log.info(`Starting dev server...`);

  // 0. Cloudflare Types
  await generateCloudflareTypes();

  // Ensure .buncf exists
  if (!fs.existsSync(".buncf")) fs.mkdirSync(".buncf");

  // 1. Client Build Watcher
  const clientEntry = ["./src/client.tsx", "./src/client.jsx", "./client.tsx", "./client.jsx"].find(path => Bun.file(path).size > 0);

  // Generate routes once
  await generateRoutesManifest();

  // Generate type-safe API client
  // @ts-ignore
  const { generateAllApiTypes } = await import("../codegen");
  await generateAllApiTypes(process.cwd(), { verbose: flags.verbose });

  // Helper: Manage Build Error State
  const setError = async (type: string, error: any) => {
    const errorData = {
      type,
      message: error.message || String(error),
      stack: error.stack,
      timestamp: Date.now()
    };
    await Bun.write(".buncf/error.json", JSON.stringify(errorData, null, 2));
  };

  const clearError = async () => {
    const errorFile = Bun.file(".buncf/error.json");
    if (await errorFile.exists()) {
      await fs.promises.unlink(".buncf/error.json");
    }
  };

  const buildClient = async () => {
    try {
      const config = await loadConfig();
      const userPlugins = config.plugins || [];
      const plugins = [deduplicateReactPlugin, serverActionsClientPlugin, ...userPlugins];

      // Filter public env vars
      const publicEnv = Object.keys(process.env).reduce((acc, key) => {
        if (key.startsWith("PUBLIC_") || key.includes("_PUBLIC_")) {
          acc[key] = process.env[key];
        }
        return acc;
      }, {} as Record<string, string | undefined>);

      // Initialize Buncf Plugins
      // @ts-ignore
      const { initializePlugins } = await import("../plugin-registry");
      const buncfPluginsConfig = config.buncfPlugins || [];
      const pluginRegistry = await initializePlugins(buncfPluginsConfig);

      const combinedPlugins = [
        deduplicateReactPlugin,
        serverActionsClientPlugin,
        ...userPlugins,
        ...(pluginRegistry.buildPlugins || [])
      ];
      await Bun.build({
        entrypoints: [clientEntry as string],
        outdir: "./.buncf/cloudflare/assets",
        target: "browser",
        format: "esm",
        minify: true,
        define: {
          "process.env.NODE_ENV": JSON.stringify("development"),
          "process.env": JSON.stringify(publicEnv),
          "process.browser": "true"
        },
        plugins: combinedPlugins,
        naming: "[name].[ext]",
      });

      const cssEntries = ["./src/globals.css", "./src/index.css", "./globals.css", "./index.css"];
      for (const cssFile of cssEntries) {
        if (Bun.file(cssFile).size > 0) {
          try {
            await Bun.build({
              entrypoints: [cssFile],
              outdir: "./.buncf/cloudflare/assets",
              target: "browser",
              plugins: combinedPlugins,
              naming: "[name].[ext]",
              minify: true,
            });
          } catch (e) {
            console.error("CSS build error:", e);
          }
        }
      }

      // Copy Plugin Assets
      if (pluginRegistry.assets) {
        if (!fs.existsSync("./.buncf/cloudflare/assets")) fs.mkdirSync("./.buncf/cloudflare/assets", { recursive: true });
        for (const [virtualPath, sourcePath] of Object.entries(pluginRegistry.assets)) {
          try {
            // Remove leading slash for destination inside assets dir
            const destName = virtualPath.startsWith("/") ? virtualPath.slice(1) : virtualPath;
            // If the virtualPath is complex (e.g. _cms/admin.js), ensure dir exists
            const destPath = path.resolve("./.buncf/cloudflare/assets", destName);
            const destDir = path.dirname(destPath);
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

            await Bun.write(destPath, Bun.file(sourcePath));
          } catch (e) {
            console.error(`Failed to copy plugin asset ${virtualPath}:`, e);
          }
        }
      }

      const indexCandidates = ["./src/index.html", "./index.html"];
      for (const candidate of indexCandidates) {
        if (fs.existsSync(candidate)) {
          let html = fs.readFileSync(candidate, "utf8");
          html = html
            .replace(/src=["'](?:\.?\/)?(.*)\.(tsx|ts|jsx)["']/g, 'src="/$1.js"')
            .replace(/href=["'](?:\.?\/)?(.*)\.css["']/g, 'href="/$1.css"');

          if (!fs.existsSync("./.buncf/cloudflare/assets")) fs.mkdirSync("./.buncf/cloudflare/assets", { recursive: true });
          fs.writeFileSync("./.buncf/cloudflare/assets/index.html", html);
          break;
        }
      }

      console.log(colors.dim("[wait]") + "  client & css built");
    } catch (e) {
      log.error("Client build failed");
      await setError("Client Build Error", e);
    }
  };
  await buildClient();

  let timer: ReturnType<typeof setTimeout>;
  fs.watch(path.resolve(process.cwd(), "src"), { recursive: true }, (event, filename) => {
    if (!filename) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (filename.includes("pages")) await generateRoutesManifest();
      await buildClient();
    }, 100);
  });

  // 2. Start Bun Server (Worker Runtime)
  log.step("Starting worker runtime...");

  const devModulePath = path.resolve(import.meta.dir, "../dev.ts").replace(/\\/g, "/");

  // --- ERROR OVERLAY RESOURCES ---
  // To avoid template literal hell, we define these as normal strings here, 
  // and inject them via JSON.stringify into the boot content.

  const errorTemplateFn = `
  function getErrorHtml(title, message, stack) {
    // Parse stack for file link logic (runs on server to render initial HTML)
    let fileLink = '';
    
    // Attempt cleanup of stack to find user file
    // Format: at Function (<path>:<line>:<col>)
    if (stack) {
       // Search for strict file paths (e.g. C:/ or /User) avoiding internal/node_modules if possible
       const lines = stack.split('\\n');
       for (const line of lines) {
          // crude match for file path with line/col
          const match = line.match(/\\((?:[A-Z]:\\\\|\\/)([^:]+):(\\d+):(\\d+)\\)/) || 
                        line.match(/at (?:[A-Z]:\\\\|\\/)([^:]+):(\\d+):(\\d+)/);
          
          if (match) {
             const [_, file, line, col] = match;
             if (!file.includes('node_modules') && !file.includes('buncf/src')) {
                // If we found a likely user file
                const vscodeUrl = "vscode://file/" + file + ":" + line + ":" + col;
                // Add button html
                fileLink = '<a href="' + vscodeUrl + '" class="btn open-btn">📝 Open in Editor</a>';
                break; 
             }
          }
       }
    }

    return \`<!DOCTYPE html>
    <html>
      <head>
        <title>\${title}</title>
        <style>
          body { background: #0d1117; color: #e6edf3; font-family: system-ui, -apple-system, sans-serif; padding: 0; margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center; }
          .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); z-index: 9999; }
          .error-box { position: relative; width: 90%; max-width: 900px; max-height: 90vh; background: #161b22; border: 1px solid #30363d; border-radius: 12px; box-shadow: 0 24px 48px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden; animation: slideIn 0.3s ease-out; z-index: 10000; }
          .header { background: #21262d; padding: 1rem 1.5rem; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: start; }
          .title-area h1 { color: #ff7b72; font-size: 1.1rem; margin: 0; font-weight: 600; display: flex; align-items: center; gap: 0.75rem; }
          .title-area .badge { background: #7f1d1d; color: #fca5a5; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px; border: 1px solid #ef4444; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .content { padding: 1.5rem; overflow-y: auto; }
          .message { font-size: 1.25rem; font-weight: 500; line-height: 1.5; color: #e6edf3; margin-bottom: 1.5rem; white-space: pre-wrap; word-break: break-word; }
          .stack-frame { background: #0d1117; padding: 1rem; border-radius: 8px; overflow-x: auto; border: 1px solid #30363d; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.85rem; color: #d2a8ff; line-height: 1.6; }
          .actions { padding: 1rem 1.5rem; border-top: 1px solid #30363d; background: #21262d; display: flex; justify-content: flex-end; gap: 0.75rem; }
          .btn { appearance: none; background: transparent; border: 1px solid #30363d; color: #c9d1d9; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 500; text-decoration: none; }
          .btn:hover { background: #30363d; color: #fff; }
          .open-btn { background: #1f6feb; border-color: #1f6feb; color: #fff; }
          .open-btn:hover { background: #388bfd; border-color: #388bfd; }
          @keyframes slideIn { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        </style>
      </head>
      <body>
        <div class="backdrop"></div>
        <div class="error-box">
          <div class="header">
            <div class="title-area">
              <h1><span class="badge">Error</span> \${title}</h1>
            </div>
          </div>
          <div class="content">
            <div class="message">\${message}</div>
            \${stack ? '<div class="stack-frame">' + stack + '</div>' : ''}
          </div>
          <div class="actions">
            \${fileLink}
            <button class="btn" style="opacity: 0.7; cursor: not-allowed">Live Reload Active</button>
          </div>
        </div>
        <script>
        (function() {
            const protocol = location.protocol === "https:" ? "wss:" : "ws:";
            const url = protocol + "//" + location.host + "/_buncf_livereload";
            function connect() {
                const ws = new WebSocket(url);
                ws.onclose = () => { setTimeout(connect, 1000); };
                ws.onmessage = (e) => { if (e.data === "reload") location.reload(); };
            }
            connect();
        })();
        </script>
      </body>
    </html>\`; 
  }
  `;

  const clientErrorScriptCode = `
<script>
(function() {
    // 1. Live Reload
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const url = protocol + "//" + location.host + "/_buncf_livereload";
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => { setTimeout(connect, 1000); };
        ws.onmessage = (e) => {
             if (e.data === "reload") location.reload(); 
        };
    }
    connect();

    // 2. Client Side Error Overlay
    function showError(title, message, stack) {
        if (document.getElementById('buncf-error-overlay')) return;

        let fileUrl = null;
        if (stack) {
            // Match (at http://localhost:3000/src/pages/index.tsx:10:5)
            const match = stack.match(/((?:http:\\/\\/|\\/)[^:]+):(\\d+):(\\d+)/);
            if (match) {
                let path = match[1];
                try {
                    const u = new URL(path);
                    path = u.pathname; 
                } catch(e) {}
                
                if (path.match(/\\.(tsx|ts|jsx|js)$/)) {
                     // We store params to call server opener
                     fileUrl = { path, line: match[2], col: match[3] };
                }
            }
        }

        const overlay = document.createElement('div');
        overlay.id = 'buncf-error-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;animation:buncfSlideIn 0.2s ease-out;';
        
        let fileBtnHtml = '';
        if (fileUrl) {
            fileBtnHtml = '<button id="buncf-open-btn" style="background:#1f6feb;border:1px solid #1f6feb;color:#fff;padding:0.4rem 0.8rem;border-radius:6px;font-size:0.85rem;cursor:pointer;font-weight:500;display:flex;align-items:center;gap:0.4rem;">📝 Open in Editor</button>';
        }

        const cardHtml = \`
           <div style="position:relative;width:90%;max-width:900px;max-height:90vh;background:#161b22;border:1px solid #30363d;border-radius:12px;box-shadow:0 24px 48px rgba(0,0,0,0.5);display:flex;flex-direction:column;overflow:hidden;color:#e6edf3;">
             <div style="background:#21262d;padding:1rem 1.5rem;border-bottom:1px solid #30363d;display:flex;justify-content:space-between;align-items:start;">
                <h1 style="color:#ff7b72;font-size:1.1rem;margin:0;font-weight:600;display:flex;align-items:center;gap:0.75rem;">
                  <span style="background:#7f1d1d;color:#fca5a5;font-size:0.7rem;padding:0.1rem 0.4rem;border-radius:4px;border:1px solid #ef4444;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Runtime Error</span>
                  \${title}
                </h1>
                <button id="buncf-close-btn" style="background:transparent;border:none;color:#8b949e;cursor:pointer;padding:4px;border-radius:4px;display:flex;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
             </div>
             <div style="padding:1.5rem;overflow-y:auto;">
               <div style="font-size:1.25rem;font-weight:500;line-height:1.5;color:#e6edf3;margin-bottom:1.5rem;white-space:pre-wrap;word-break:break-word;">\${message}</div>
               \${stack ? '<div style="background:#0d1117;padding:1rem;border-radius:8px;overflow-x:auto;border:1px solid #30363d;font-family:monospace;font-size:0.85rem;color:#d2a8ff;line-height:1.6;">' + stack + '</div>' : ''}
             </div>
             <div style="padding:1rem 1.5rem;border-top:1px solid #30363d;background:#21262d;display:flex;justify-content:flex-end;gap:0.75rem;">
                \${fileBtnHtml}
             </div>
           </div>
           <style>@keyframes buncfSlideIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }</style>
        \`;
        
        overlay.innerHTML = cardHtml;
        document.body.appendChild(overlay);

        document.getElementById('buncf-close-btn').onclick = () => overlay.remove();
        
        if (fileUrl) {
            document.getElementById('buncf-open-btn').onclick = () => {
                const url = '/_buncf/open-editor?file=' + encodeURIComponent(fileUrl.path) + '&line=' + fileUrl.line + '&col=' + fileUrl.col;
                fetch(url).catch(e => console.error(e));
            };
        }
    }

    window.addEventListener('error', (event) => {
        showError('Runtime Error', event.message, event.error ? event.error.stack : null);
    });

    window.addEventListener('unhandledrejection', (event) => {
        showError('Unhandled Promise Rejection', event.reason.message || String(event.reason), event.reason.stack);
    });
})();
</script>
`;

  // Inject into boot.ts as proper strings
  const bootContent = `
import * as fs from "node:fs";
// @ts-ignore
import { initBuncfDev, getDevContext } from "${devModulePath}";

console.log("[Buncf] Booting dev server...");

// Define helpers from strings
// We use Function constructor or just eval or raw code injection if we are generating a file.
// Since we are generating a TS file, we can just dump the code if it is valid TS.

${errorTemplateFn}

const clientErrorScript = ${JSON.stringify(clientErrorScriptCode)};

const remote = ${JSON.stringify(flags.remote || false)};
await initBuncfDev({ remote });

// Import worker dynamically AFTER initializing dev context
// This prevents TLA in worker (e.g. plugin initialization) from running before bindings are ready
const { default: worker } = await import("./dev.js");

const checkBuildError = async () => {
    try {
        if (await Bun.file(".buncf/error.json").exists()) {
            const err = await Bun.file(".buncf/error.json").json();
            return new Response(getErrorHtml(err.type, err.message, err.stack), {
                headers: { "Content-Type": "text/html" },
                status: 500
            });
        }
    } catch(e) {}
    return null;
};

const openEditor = (file: string, line: string, col: string) => {
    // Basic path sanitation
    const cwd = "${process.cwd().replace(/\\/g, "/")}";
    const fullPath = path.join(cwd, file);
    try {
        Bun.spawn(["code", "-g", \`\${fullPath}:\${line}:\${col}\`]);
    } catch(e) {
        console.error("Failed to open editor:", e);
    }
};

Bun.serve({
  port: 3000,
  websocket: {
    message() {},
    open(ws) { ws.subscribe("reload"); },
    close() {}
  },
  async fetch(req, server) {
     const url = new URL(req.url);

     if (url.pathname === "/_buncf/open-editor") {
        const file = url.searchParams.get("file");
        const line = url.searchParams.get("line") || "1";
        const col = url.searchParams.get("col") || "1";
        if (file) {
            openEditor(file, line, col);
            return new Response("Opened", { status: 200 });
        }
        return new Response("Missing file param", { status: 400 });
     }

     const buildErrorReq = await checkBuildError();
     if (buildErrorReq) return buildErrorReq;

     const devCtx = getDevContext();
     const env = { ...Bun.env, ...(devCtx?.env || {}) };

     if (req.url.endsWith("/_buncf_livereload")) {
         if (server.upgrade(req)) return undefined;
         return new Response("WS Upgrade Failed", { status: 500 });
     }

     try {
       const res = await worker.fetch(req, env, {});
       
       if (res.headers.get("Content-Type")?.includes("text/html")) {
           const oldBody = await res.text();
           const newHeaders = new Headers(res.headers);
           newHeaders.delete("Content-Length");
           newHeaders.delete("Content-Encoding");

           const newBody = oldBody.replace("</body>", clientErrorScript + "</body>");

           return new Response(newBody, {
               status: res.status,
               statusText: res.statusText,
               headers: newHeaders
           });
       }
       return res;
     } catch (e: any) {
       console.error(e);
       return new Response(getErrorHtml("Runtime Error", e.message, e.stack), {
           status: 500,
           headers: { "Content-Type": "text/html" }
       });
     }
  }
});

console.log("\\n" + "🚀 Server running at http://localhost:3000");  
console.log(
  "   " + "\\x1b[2m[Live Reload Active]\\x1b[0m"
);
`;

  await Bun.write(".buncf/boot.ts", bootContent);

  const buildWorker = async () => {
    try {
      const config = await loadConfig();
      await Bun.build({
        entrypoints: [entrypoint],
        minify: true,
        outdir: ".buncf",
        naming: "dev.js",
        target: "bun",
        format: "esm",
        splitting: true,
        define: {
          "process.env.NODE_ENV": JSON.stringify("development"),
        },
        // @ts-ignore
        plugins: [bunToCloudflare(entrypoint), serverActionsWorkerPlugin, ...(config.plugins || [])],
        sourcemap: "inline",
        // @ts-ignore
        external: ["buncf", "buncf/dev"]
      });
      console.log(colors.green(`[${new Date().toLocaleTimeString()}] Worker reloaded`));
      await clearError();
    } catch (e) {
      log.error("Worker build failed");
      console.error(e);
      await setError("Worker Build Error", e);
    }
  };

  await buildWorker();

  const proc = spawn("bun", ["run", "--watch", ".buncf/boot.ts"], {
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "1" }
  });

  let workerTimer: ReturnType<typeof setTimeout>;
  fs.watch(path.resolve(process.cwd(), "src"), { recursive: true }, (event, filename) => {
    if (filename && !filename.includes("client") && !filename.includes("css")) {
      clearTimeout(workerTimer);
      workerTimer = setTimeout(buildWorker, 100);
    }
  });

  await new Promise(() => { });
}
