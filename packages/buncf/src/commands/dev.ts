
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
// @ts-ignore
import { bunToCloudflare } from "../plugin";
// @ts-ignore
import { log, colors } from "../utils/log";

// Deduplicate React Plugin (Repeated for dev command simplicity)
const deduplicateReactPlugin = {
  name: "deduplicate-react",
  setup(build: any) {
    build.onResolve({ filter: /^react(-dom)?$/ }, (args: any) => {
      try {
        const projectRoot = process.cwd();
        const pkgName = args.path;
        const packageJsonPath = path.join(projectRoot, "node_modules", pkgName, "package.json");
        if (fs.existsSync(packageJsonPath)) {
          return { path: require.resolve(pkgName, { paths: [projectRoot] }) };
        }
      } catch (e) { }
      return undefined;
    });
  }
};

// Ignore CSS Plugin (Repeated for dev command simplicity)
const ignoreCssPlugin = {
  name: "ignore-css",
  setup(build: any) {
    build.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
  }
};

function showBanner() {
  console.log(colors.cyan(`
   __                            ___ 
  |  |--.--.--.-----..----.----.|  _|
  |  _  |  |  |     ||  __|  __||  _|
  |_____|_____|__|__||____|____||_|  vDEV
  ${colors.dim("Build & Deploy Bun to Cloudflare Workers")}
`));
}

// Helper to generate client routes manifest (Same as before)
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

  // Ensure .buncf exists
  if (!fs.existsSync(".buncf")) fs.mkdirSync(".buncf");

  // 1. Client Build Watcher
  const clientEntry = ["./src/client.tsx", "./src/client.jsx", "./client.tsx", "./client.jsx"].find(path => Bun.file(path).size > 0);

  if (clientEntry) {
    // @ts-ignore
    const { default: tailwind } = await import("bun-plugin-tailwind");

    // Generate routes once
    await generateRoutesManifest();

    // Generate type-safe API client
    // @ts-ignore
    const { generateAllApiTypes } = await import("../codegen");
    await generateAllApiTypes(process.cwd(), { verbose: flags.verbose });

    // Initial build + Watch
    const buildClient = async () => {
      try {
        const plugins = tailwind ? [tailwind, deduplicateReactPlugin, ignoreCssPlugin] : [deduplicateReactPlugin, ignoreCssPlugin];

        // Filter public env vars
        const publicEnv = Object.keys(process.env).reduce((acc, key) => {
          if (
            key.startsWith("PUBLIC_") ||
            key.includes("_PUBLIC_")
          ) {
            acc[key] = process.env[key];
          }
          return acc;
        }, {} as Record<string, string | undefined>);

        await Bun.build({
          entrypoints: [clientEntry],
          outdir: "./.buncf/cloudflare/assets",
          target: "browser",
          format: "esm",
          define: {
            "process.env.NODE_ENV": JSON.stringify("development"),
            "process.env": JSON.stringify(publicEnv),
            "process.browser": "true"
          },
          plugins,
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
                plugins,
                naming: "[name].[ext]"
              });
            } catch (e) {
              console.error("CSS build error:", e);
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

            // Ensure directory exists
            if (!fs.existsSync("./.buncf/cloudflare/assets")) fs.mkdirSync("./.buncf/cloudflare/assets", { recursive: true });
            fs.writeFileSync("./.buncf/cloudflare/assets/index.html", html);
            break;
          }
        }

        console.log(colors.dim("[wait]") + "  client & css built");
      } catch (e) {
        log.error("Client build failed");
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
  }

  // 2. Start Bun Server (Worker Runtime)
  log.step("Starting worker runtime...");

  const devModulePath = path.resolve(import.meta.dir, "../dev.ts").replace(/\\/g, "/");

  const bootContent = `
import worker from "./dev.js";

// Import Dev Utils dynamically using absolute path resolved by CLI
// @ts-ignore
import { initBuncfDev, getDevContext } from "${devModulePath}";

console.log("[Buncf] Booting dev server...");

// Initialize Bindings (Miniflare)
const remote = ${JSON.stringify(flags.remote || false)};
await initBuncfDev({ remote });

Bun.serve({
  port: 3000,
  websocket: {
    message() {},
    open(ws) { ws.subscribe("reload"); },
    close() {}
  },
  async fetch(req, server) {
     const devCtx = getDevContext();
     const env = { ...Bun.env, ...(devCtx?.env || {}) };

     // Upgrade to WS for Live Reload
     if (req.url.endsWith("/_buncf_livereload")) {
         if (server.upgrade(req)) return undefined;
         return new Response("WS Upgrade Failed", { status: 500 });
     }

     try {
       // Forward to worker
       const res = await worker.fetch(req, env, {});
       
       // Handle HTML responses
       if (res.headers.get("Content-Type")?.includes("text/html")) {
           const oldBody = await res.text();
           const newHeaders = new Headers(res.headers);
           newHeaders.delete("Content-Length");
           newHeaders.delete("Content-Encoding");

           const newBody = oldBody.replace("</body>", \`
<script>
(function() {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const url = protocol + "//" + location.host + "/_buncf_livereload";
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            console.log("[buncf] Disconnected. Retrying...");
            setTimeout(connect, 1000);
        };
        ws.onmessage = (e) => {
            if (e.data === "reload") location.reload();
        };
    }
    connect();
})();
</script></body>\`);

           return new Response(newBody, {
               status: res.status,
               statusText: res.statusText,
               headers: newHeaders
           });
       }
       return res;
     } catch (e) {
       return new Response(e.stack, { status: 500 });
     }
  }
});

console.log("\\n" + "🚀 Server running at http://localhost:3000");  
console.log(
  "   " + "\\x1b[2m[Live Reload Active]\\x1b[0m"
);
`;
  await Bun.write(".buncf/boot.ts", bootContent);

  // B. Build Function for Worker
  const buildWorker = async () => {
    try {
      await Bun.build({
        entrypoints: [entrypoint],
        outdir: ".buncf",
        naming: "dev.js", // force specific name
        target: "bun",
        format: "esm",
        define: {
          "process.env.NODE_ENV": JSON.stringify("development"),
        },
        // @ts-ignore
        plugins: [bunToCloudflare(entrypoint)],
        sourcemap: "inline",
        // @ts-ignore
        external: ["buncf", "buncf/dev"] // Don't bundle the pkg itself if imported
      });
      // timestamp
      console.log(colors.green(`[${new Date().toLocaleTimeString()}] Worker reloaded`));
    } catch (e) {
      log.error("Worker build failed");
      console.error(e);
    }
  };

  await buildWorker();

  // C. Spawn Runner
  const proc = spawn("bun", ["run", "--watch", ".buncf/boot.ts"], {
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "1" }
  });

  // D. Watch Source to Trigger Rebuilds
  let workerTimer: ReturnType<typeof setTimeout>;
  fs.watch(path.resolve(process.cwd(), "src"), { recursive: true }, (event, filename) => {
    if (filename && !filename.includes("client") && !filename.includes("css")) {
      clearTimeout(workerTimer);
      workerTimer = setTimeout(buildWorker, 100);
    }
  });

  // Keep alive
  await new Promise(() => { });
}
