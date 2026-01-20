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
import { autoCssPlugin } from "../plugins/css";
import { loadConfig } from "../utils/config";
import { generateRoutesManifest } from "../utils/manifest";
import { getPublicEnv } from "../utils/env";
import { errorTemplateFn, clientErrorScriptCode } from "../utils/dev-templates";

function showBanner() {
  console.log(colors.cyan(`
   __                            ___ 
  |  |--.--.--.-----..----.----.|  _|
  |  _  |  |  |     ||  __|  __||  _|
  |_____|_____|__|__||____|____||_|  vDEV
  ${colors.dim("Build & Deploy Bun to Cloudflare Workers")}
`));
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
      const plugins = [deduplicateReactPlugin, serverActionsClientPlugin, autoCssPlugin, ...userPlugins];

      // Filter public env vars
      const publicEnv = getPublicEnv();

      // Initialize Buncf Plugins
      // @ts-ignore
      const { initializePlugins } = await import("../plugin-registry");
      const buncfPluginsConfig = config.buncfPlugins || [];
      const pluginRegistry = await initializePlugins(buncfPluginsConfig);

      const combinedPlugins = [
        deduplicateReactPlugin,
        serverActionsClientPlugin,
        autoCssPlugin,
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
