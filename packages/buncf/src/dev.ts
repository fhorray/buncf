import * as fs from "node:fs";
import * as path from "node:path";
import type { CloudflareEnv } from "./types";
import { WorkflowDatabase } from "./workflows/db";
import { WorkflowBinding } from "./workflows/binding";
import { handleWorkflowApi } from "./workflows/api";

let devContext: { env: CloudflareEnv; workflowDb?: WorkflowDatabase } | null = null;
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

      // 1. Prioritize Direct Miniflare (Faster and more stable in many environments)
      if (!options?.remote) {
        try {
          let Miniflare: any;
          try {
            const m = await import("mini" + "flare");
            Miniflare = m.Miniflare;
          } catch (e) {
            try {
              const userMiniflarePath = Bun.resolveSync("miniflare", process.cwd());
              const m = await import(userMiniflarePath);
              Miniflare = m.Miniflare;
            } catch (e2) {
              console.log("[Buncf Dev] Miniflare not found, trying Wrangler proxy...");
            }
          }

          if (Miniflare) {
            console.log(`[Buncf Dev] Initializing direct Miniflare...`);

            let configPath = options?.wranglerConfigPath || "";
            if (!configPath) {
              const candidates = ["wrangler.jsonc", "wrangler.json", "wrangler.toml"];
              for (const c of candidates) {
                if (await Bun.file(path.resolve(process.cwd(), c)).exists()) {
                  configPath = c;
                  break;
                }
              }
            }

            const bindingsOptions: any = {};
            if (configPath) {
              try {
                const content = await Bun.file(path.resolve(process.cwd(), configPath)).text();
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

                  // Parse Workflows
                  // [[workflows]]
                  // name = "workflow-name"
                  // binding = "MY_WORKFLOW"
                  // class_name = "MyWorkflow"
                  const parseWorkflows = () => {
                    const regex = /\[\[workflows\]\][\s\S]*?binding\s*=\s*"([^"]+)"[\s\S]*?class_name\s*=\s*"([^"]+)"/g;
                    const matches = [];
                    let match;
                    while ((match = regex.exec(content)) !== null) {
                      matches.push({ binding: match[1], class_name: match[2] });
                    }
                    return matches;
                  };
                  config.workflows = parseWorkflows();
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
              d1Persist: ".wrangler/state/v3/d1",
              ...bindingsOptions
            });

            env = await mf.getBindings();
            console.log("[Buncf Dev] Direct Miniflare ready.");
          }
        } catch (e) {
          console.warn("[Buncf Dev] Direct Miniflare failed, falling back to Wrangler:", (e as any).message);
        }
      }

      // 2. Fallback: Wrangler getPlatformProxy (Always for remote, or if Miniflare failed)
      if (!env) {
        try {
          let wrangler;
          let wranglerPath;
          try {
            wranglerPath = Bun.resolveSync("wrangler", process.cwd());
            if (wranglerPath.endsWith("wrangler.json") || wranglerPath.endsWith("wrangler.toml")) {
              const pkgPath = Bun.resolveSync("wrangler/package.json", process.cwd());
              const pkg = await import(pkgPath);
              const main = pkg.default?.main || pkg.main || "wrangler-dist/cli.js";
              wranglerPath = path.resolve(path.dirname(pkgPath), main);
            }
          } catch (e) { }

          wrangler = await import(wranglerPath || "wrangler");
          if (wrangler.default && !wrangler.getPlatformProxy) {
            wrangler = wrangler.default;
          }

          const proxyFn = wrangler.getPlatformProxy || wrangler.unstable_getPlatformProxy;

          if (proxyFn) {
            console.log(`[Buncf Dev] Using wrangler getPlatformProxy${options?.remote ? " (REMOTE)" : ""}...`);

            const proxyPromise = proxyFn({
              configPath: options?.wranglerConfigPath,
              persist: true,
              remote: options?.remote,
            });

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout initializing platform proxy")), 5000)
            );

            try {
              const proxy = await Promise.race([proxyPromise, timeoutPromise]) as any;
              env = proxy.env;
              console.log("[Buncf Dev] Platform proxy initialized.");
            } catch (e) {
              throw e;
            }
          }
        } catch (e) {
          console.error("[Buncf Dev] Wrangler fallback failed:", (e as any).message);
        }
      }

      env = env || {};

      // Initialize Workflows System
      let workflowDb: WorkflowDatabase | undefined;
      try {
        workflowDb = new WorkflowDatabase();
        console.log("[Buncf Dev] Initialized Workflow Database.");

        // Inject Workflow Bindings
        // We need to re-read config to find workflow bindings since Miniflare might not return them if it doesn't support them natively yet
        // or if we want to override them with our native implementation.

        let workflowsConfig: { binding: string, class_name: string }[] = [];

        // Re-parse config if we can find it
        const configCandidates = ["wrangler.jsonc", "wrangler.json", "wrangler.toml"];
        for (const c of configCandidates) {
          const cp = path.resolve(process.cwd(), c);
          if (await Bun.file(cp).exists()) {
            const content = await Bun.file(cp).text();
            if (c.endsWith(".toml")) {
              const regex = /\[\[workflows\]\][\s\S]*?binding\s*=\s*"([^"]+)"[\s\S]*?class_name\s*=\s*"([^"]+)"/g;
              let match;
              while ((match = regex.exec(content)) !== null) {
                workflowsConfig.push({ binding: match[1] as string, class_name: match[2] as string });
              }
            } else {
              // Parse JSON/JSONC
              try {
                const config = (Bun as any).JSONC ? (Bun as any).JSONC.parse(content) : JSON.parse(content);
                if (config.workflows && Array.isArray(config.workflows)) {
                  for (const wf of config.workflows) {
                    if (wf.binding && wf.class_name) {
                      workflowsConfig.push({ binding: wf.binding, class_name: wf.class_name });
                    }
                  }
                }
              } catch (e) {
                console.warn("[Buncf Dev] Failed to parse workflow config from JSON:", e);
              }
            }
            break;
          }
        }

        if (workflowsConfig.length > 0) {
          // Try to load user entrypoint to find classes
          // Use the compiled dev.js which has cloudflare:workers resolved
          const entrypoints = [".buncf/dev.js", "src/index.ts", "src/index.tsx", "src/worker.ts"];
          let userModule: any = null;

          for (const ep of entrypoints) {
            const p = path.resolve(process.cwd(), ep);
            if (await Bun.file(p).exists()) {
              try {
                userModule = await import(p);
                console.log(`[Buncf Dev] Loaded workflow classes from ${ep}`);
                break;
              } catch (e) {
                // Only warn for non-.buncf paths
                if (!ep.startsWith(".buncf")) {
                  console.warn(`[Buncf Dev] Failed to load entrypoint ${ep} for workflows:`, e);
                }
              }
            }
          }

          if (userModule) {
            for (const wf of workflowsConfig) {
              const WorkflowClass = userModule[wf.class_name];
              if (WorkflowClass) {
                console.log(`[Buncf Dev] Binding Workflow '${wf.binding}' to class '${wf.class_name}'`);
                env[wf.binding] = new WorkflowBinding(workflowDb, WorkflowClass, env);
              } else {
                console.warn(`[Buncf Dev] Workflow class '${wf.class_name}' not found in entrypoint exports.`);
              }
            }
          } else {
            console.warn("[Buncf Dev] Could not load user entrypoint to resolve Workflow classes.");
          }
        }

      } catch (e: any) {
        console.error("[Buncf Dev] Failed to initialize Workflow Database or Bindings:", e);
      }

      // 3. Polyfill ASSETS if missing or misconfigured (for local dev)
      if (!env.ASSETS || true) { // Force override to ensure local assets are served
        console.log("[Buncf Dev] Polyfilling ASSETS binding for local development...");
        env.ASSETS = {
          fetch: async (req: Request) => {
            const url = new URL(req.url);
            // console.log(`[Buncf Dev] ASSETS.fetch: ${url.pathname}`);

            try {
              // Intercept Workflow API and UI requests
              if (url.pathname.startsWith("/_buncf/workflows")) {
                if (url.pathname.startsWith("/_buncf/workflows/api") && workflowDb) {
                  const apiResponse = await handleWorkflowApi(req, workflowDb);
                  if (apiResponse) return apiResponse;
                }

                // Serve Dashboard
                if (url.pathname === "/_buncf/workflows" || url.pathname === "/_buncf/workflows/") {
                  try {
                    const { renderDashboard } = await import("./workflows/ui/index");
                    return new Response(renderDashboard(), { headers: { "Content-Type": "text/html" } });
                  } catch (e: any) {
                    console.error("[Buncf Dev] Failed to render dashboard:", e.message);
                    return new Response("Error rendering dashboard: " + e.message, { status: 500 });
                  }
                }
              }
            } catch (e: any) {
              console.error("[Buncf Dev] ASSETS.fetch intercept error:", e.message);
            }

            const assetsRoot = path.join(process.cwd(), ".buncf/cloudflare/assets");
            let requestedPath = path.join(assetsRoot, url.pathname);

            try {
              const stats = await fs.promises.stat(requestedPath);
              if (stats.isDirectory()) {
                // If it's a directory, immediately switch to index.html
                requestedPath = path.join(assetsRoot, "index.html");
              }
            } catch (e: any) {
              // If stat fails (e.g., ENOENT), it's not a file or directory that exists.
              // Fallback to index.html for SPA routing.
              if (e.code === 'ENOENT') {
                requestedPath = path.join(assetsRoot, "index.html");
              } else {
                // For other errors, log it and return 404.
                console.error("[Buncf Dev] Asset serving stat error:", e);
                return new Response("Not Found", { status: 404 });
              }
            }

            const file = Bun.file(requestedPath);
            if (await file.exists()) {
              // Explicitly set Content-Type as it may not be automatically set in all environments
              const ext = path.extname(requestedPath);
              const mimeTypes: Record<string, string> = {
                ".html": "text/html",
                ".js": "text/javascript",
                ".css": "text/css",
                ".txt": "text/plain",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".svg": "image/svg+xml",
                ".json": "application/json",
              };
              return new Response(file, {
                headers: {
                  "Content-Type": mimeTypes[ext] || "application/octet-stream",
                },
              });
            }

            return new Response("Not Found", { status: 404 });
          }
        };
      }

      devContext = { env: env as CloudflareEnv, workflowDb };
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
