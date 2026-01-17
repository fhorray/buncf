import * as fs from "node:fs";
import * as path from "node:path";
import type { CloudflareEnv } from "./types";

let devContext: { env: CloudflareEnv } | null = null;
let initPromise: Promise<void> | null = null;

export async function initBuncfDev(options?: {
  wranglerConfigPath?: string;
  remote?: boolean;
}) {
  // Only run in development (or test)
  if (process.env.NODE_ENV === "production") return;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      let env: any;
      let wrangler;

      try {
        // 1. Try to use wrangler's getPlatformProxy (Standard way for Miniflare 3)
        wrangler = await import("wran" + "gler");
        if (wrangler.getPlatformProxy || wrangler.unstable_getPlatformProxy) {
          const getProxy = wrangler.getPlatformProxy || wrangler.unstable_getPlatformProxy;
          console.log(`[Buncf Dev] Using wrangler getPlatformProxy${options?.remote ? " (REMOTE)" : ""}...`);

          const proxy = await getProxy({
            configPath: options?.wranglerConfigPath,
            persist: true,
            remote: options?.remote,
          });

          env = proxy.env;
          console.log("[Buncf Dev] Platform proxy initialized.");
        }
      } catch (e) {
        // Fallback to manual setup if wrangler proxy fails
        console.log("[Buncf Dev] Wrangler proxy not available, falling back to manual Miniflare.");
      }

      if (!env) {
        // 2. Fallback: Manual Miniflare setup (our previous logic)
        let Miniflare;
        try {
          const m = await import("mini" + "flare");
          Miniflare = m.Miniflare;
        } catch (e) {
          try {
            const userMiniflarePath = Bun.resolveSync("miniflare", process.cwd());
            const m = await import(userMiniflarePath);
            Miniflare = m.Miniflare;
          } catch (e2) {
            throw new Error("Miniflare not found. Install it to enable local bindings.");
          }
        }

        console.log(`[Buncf Dev] Initializing manual Miniflare${options?.remote ? " (REMOTE)" : ""}...`);

        let configPath = options?.wranglerConfigPath || "";
        if (!configPath) {
          const candidates = ["wrangler.jsonc", "wrangler.json", "wrangler.toml"];
          for (const c of candidates) {
            if (await Bun.file(c).exists()) {
              configPath = c;
              break;
            }
          }
        }

        const bindingsOptions: any = {};
        if (configPath) {
          try {
            const content = await Bun.file(configPath).text();
            let config: any = {};
            if (configPath.endsWith(".toml")) {
              const parseTomlArray = (key: string) => {
                const regex = new RegExp(`\\[\\[${key}\\]\\][\\s\\S]*?binding\\s*=\\s*"([^"]+)"`, "g");
                const matches = [];
                let match;
                while ((match = regex.exec(content)) !== null) {
                  matches.push({ binding: match[1] });
                }
                return matches;
              };
              config.kv_namespaces = parseTomlArray("kv_namespaces");
              config.d1_databases = parseTomlArray("d1_databases");
              config.r2_buckets = parseTomlArray("r2_buckets");
            } else {
              config = (Bun as any).JSONC ? (Bun as any).JSONC.parse(content) : JSON.parse(content);
            }

            if (config.kv_namespaces) bindingsOptions.kvNamespaces = config.kv_namespaces.map((k: any) => k.binding);
            if (config.d1_databases) bindingsOptions.d1Databases = config.d1_databases.map((d: any) => d.binding || d.binding_name);
            if (config.r2_buckets) bindingsOptions.r2Buckets = config.r2_buckets.map((b: any) => b.binding);
            if (config.vars) bindingsOptions.bindings = config.vars;
          } catch (e) {
            console.warn("[Buncf Dev] Manual config parse failed:", (e as any).message);
          }
        }

        const mf = new Miniflare({
          modules: true,
          script: "export default { fetch: () => new Response(null, {status: 404}) }",
          compatibilityDate: "2024-04-01",
          ...bindingsOptions
        });

        env = await mf.getBindings();
      }

      env = env || {};

      // 3. Polyfill ASSETS if missing or misconfigured (for local dev)
      if (!env.ASSETS || true) { // Force override to ensure local assets are served
        console.log("[Buncf Dev] Polyfilling ASSETS binding for local development...");
        env.ASSETS = {
          fetch: async (req: Request) => {
            const url = new URL(req.url);
            let filePath = path.join(process.cwd(), ".buncf/cloudflare/assets", url.pathname);

            // SPA / Directory Fallback
            if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
              const indexFile = path.join(process.cwd(), ".buncf/cloudflare/assets/index.html");
              if (fs.existsSync(indexFile)) filePath = indexFile;
            }

            if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
              const content = fs.readFileSync(filePath);
              const ext = path.extname(filePath);
              const mimeTypes: Record<string, string> = {
                ".html": "text/html",
                ".js": "text/javascript",
                ".css": "text/css",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".svg": "image/svg+xml",
                ".json": "application/json"
              };
              return new Response(content, {
                headers: { "Content-Type": mimeTypes[ext] || "application/octet-stream" }
              });
            }
            return new Response("Not Found", { status: 404 });
          }
        };
      }

      devContext = { env: env as CloudflareEnv };
      console.log("[Buncf Dev] Bindings ready:", Object.keys(env));
    } catch (e: any) {
      console.error("[Buncf Dev] Failed to initialize dev environment:", e.message);
      devContext = { env: {} as CloudflareEnv };
    }
  })();

  return initPromise;
}

export function getDevContext() {
  return devContext;
}

export async function waitForDevContext() {
  if (initPromise) await initPromise;
  return devContext;
}
