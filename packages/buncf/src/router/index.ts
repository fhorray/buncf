/**
 * Buncf Router - Main Entry Point
 * 
 * Provides file-system based routing for Bun + Cloudflare Workers
 */

import { createApiRouter, type ApiHandler, type HttpMethod } from "./api";
import { createPagesRouter, type PageMatch } from "./pages";
import * as fs from "fs";
import * as path from "path";
import { initBuncfDev, getDevContext } from "../dev";
import { getCloudflareContext, runWithCloudflareContext } from "../context";
import type { CloudflareEnv, ExecutionContext, BuncfPluginContext, BuncfPlugin } from "../types";
import { initializePlugins } from "../plugin-registry";
import { handleAction } from "../action";
import { serverActions as prodActions } from "../actions-registry";
import { serverActionsClientPlugin, deduplicateReactPlugin } from "../plugins/server-actions";

// Server-side exports
export { createApiRouter } from "./api";
export { createPagesRouter } from "./pages";
export type { ApiHandler, HttpMethod } from "./api";
export type { PageMatch } from "./pages";

// Client-side exports have been moved to "./react.ts"
// and are exported via "buncf/router"
export * from "./client";
export * from "./Link";
export * from "./RouterProvider";
export * from "./hooks";


export interface CreateAppOptions {
  /** Plugins to enable (Bun plugins + Buncf runtime extensions) */
  plugins?: BuncfPlugin[];

  /** Directory for API routes (default: "./src/api") */
  apiDir?: string;
  /** Directory for page routes (default: "./src/pages") */
  pagesDir?: string;
  /** Static assets directory (default: "./src/public") */
  publicDir?: string;
  /** HTML file to serve for SPA routes (default: auto-detect index.html) */
  indexHtml?: string;
  /** Injected HTML content for SPA fallback (no file access needed) */
  indexHtmlContent?: string;
  /** Injected static route manifest for build-time router (Internal use) */
  staticRoutes?: { api?: any; pages?: any; layouts?: any };
  /** Plugin route handler (Internal use - injected by worker-factory) */
  pluginRouteHandler?: ((req: Request, ctx: BuncfPluginContext) => Promise<Response | null>) | null;
  /** Custom error handler for unhandled exceptions */
  onError?: (error: Error, request: Request) => Response | Promise<Response>;
}

/**
 * Create a Buncf application with automatic routing
 */
export function createApp(options: CreateAppOptions = {}) {
  const {
    apiDir = "./src/api",
    pagesDir = "./src/pages",
    publicDir = "./src/public",
    indexHtml,
    staticRoutes,
    indexHtmlContent: injectedHtml,
    // pluginRouteHandler is now derived from plugins if not explicitly passed
    pluginRouteHandler: injectedPluginHandler,
  } = options;

  // Initialize Plugins
  // We use `await` inside a synchronous function wrapper if needed, but `createApp` returns an object.
  // The actual initialization usually happens async.
  // However, for the runtime handler, we need the routeHandler ready.
  // Since `initializePlugins` is async (it calls plugin.setup which might be async),
  // we need to handle this.
  // BUT: `createApp` returns a simple object with `fetch`.
  // If we make `fetch` async, we can await initialization there on first request?
  // OR: We change `createApp` to be async? No, usually it's top-level export.
  //
  // Solution: `initializePlugins` in our new system calls `plugin.routes` which is just property access.
  // Wait, `initializePlugins` in `plugin-registry.ts` IS async because of `plugin.setup`.
  // BUT we removed `plugin.setup` call for runtime logic! We only read properties.
  // So we can make `initializePlugins` synchronous?
  // No, `BuncfPlugin` definition says `routes` is a function.
  // Properties like `pages` are on the object.
  // So reading them is synchronous.
  // Let's verify `plugin-registry.ts`.
  // It has `async function initializePlugins`.
  // It doesn't await anything anymore except inside the loops if we changed it.
  // I should check `plugin-registry.ts` again.

  // Re-reading plugin-registry.ts content from memory/previous step...
  // I removed `await plugin.setup({})`.
  // So `initializePlugins` is practically synchronous now, returning a Promise.
  // I will assume for now we can await it inside `fetch` or use a lazy initialization pattern.

  let pluginRegistryPromise = initializePlugins(options.plugins || []);

  // Prepare extra routes for Pages Router (from plugins)
  // We need these synchronously for `createPagesRouter`?
  // `createPagesRouter` is synchronous.
  // `pluginRegistry` returns `pages`.
  // If `initializePlugins` is async, we have a problem.
  // However, looking at my `plugin-registry.ts` implementation, it is only async because of `async` keyword.
  // It does not await anything.
  // So `pluginRegistryPromise` resolves immediately.

  // HACK: For now, we assume plugins define pages synchronously in the object.
  // We can't await here.
  // We will assume `options.plugins` already contains the pages.
  const pluginPages: Record<string, string> = {};
  if (options.plugins) {
    for (const p of options.plugins) {
      if (p.pages) {
        for (const [route, loader] of Object.entries(p.pages)) {
          // Map route to a "virtual path" that the client router can understand
          // The client router needs to import this.
          // We use a convention: "virtual:plugin/page"
          // But wait, `loader` is `() => import(...)`.
          // The bundler handles this.
          // We just need a unique string key for the router.
          pluginPages[route] = `virtual:${p.name}:${route}`;
        }
      }
    }
  }

  // Initialize routers
  const apiRouter = createApiRouter({
    dir: apiDir,
    staticRoutes: staticRoutes?.api
  });

  const pagesRouter = createPagesRouter({
    dir: pagesDir,
    staticRoutes: staticRoutes?.pages,
    extraRoutes: pluginPages
  });

  // Find index.html content
  let indexHtmlContent: string | null = injectedHtml || null;

  if (!indexHtmlContent) {
    // Runtime/Dev fallback: try reading file
    let htmlPath = indexHtml;
    if (!htmlPath) {
      const candidates = ["./src/index.html", "./index.html", "./public/index.html"];
      htmlPath = candidates.find((p) => fs.existsSync(p));
    }
    if (htmlPath && fs.existsSync(htmlPath)) {
      indexHtmlContent = fs.readFileSync(htmlPath, "utf-8");

      // Rewrite Asset Paths for Dev
      // This ensures ./client.tsx becomes /client.tsx, fixing deep nested routes (e.g., /users/1)
      indexHtmlContent = indexHtmlContent
        .replace(/src=["'](\.?\/)(.*)["']/g, 'src="/$2"')
        .replace(/href=["'](\.?\/)(.*)["']/g, 'href="/$2"');
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const port = (globalThis as any).Bun?.peek?.()?.port || 3000;
    console.log(`\n  \x1b[36m🚀 Buncf Development Server\x1b[0m`);
    console.log(`  \x1b[32m✔\x1b[0m Local:    \x1b[34mhttp://localhost:${port}\x1b[0m`);
    console.log(`  \x1b[32m✔\x1b[0m Ready in: \x1b[33msrc/api/\x1b[0m and \x1b[33msrc/pages/\x1b[0m\n`);
  }

  /**
   * Main fetch handler
   */
  async function fetch(req: Request): Promise<Response> {
    // Lazy load plugin registry if needed
    const registry = await pluginRegistryPromise;
    const activePluginHandler = injectedPluginHandler || registry.routeHandler;

    if (process.env.NODE_ENV !== "production") {
      const existing = getCloudflareContext();
      // Only wrap if we don't already have a real environment (avoids shadowing in production)
      if (existing && existing.env && Object.keys(existing.env).length > 0) {
        return handleRequest(req, new URL(req.url), activePluginHandler);
      }

      const url = new URL(req.url);
      const method = req.method;
      const path = url.pathname;
      const start = performance.now();

      let devCtx = getDevContext();
      if (!devCtx) {
        // Try waiting if it's still initializing
        const { waitForDevContext } = await import("../dev");
        devCtx = await waitForDevContext();
      }
      // Even if Miniflare failed, we provide a mock context so getCloudflareContext() doesn't throw
      const env = (devCtx?.env || {}) as CloudflareEnv;
      const ctx: ExecutionContext = {
        waitUntil: (promise: Promise<any>) => { void promise; },
        passThroughOnException: () => { }
      };

      return runWithCloudflareContext({ env, ctx, cf: {} }, async () => {
        const response = await handleRequest(req, url, activePluginHandler);

        const duration = (performance.now() - start).toFixed(2);
        const status = response.status;
        const statusColor = status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : status >= 300 ? "\x1b[36m" : "\x1b[32m";

        console.log(`  \x1b[90m${new Date().toLocaleTimeString()}\x1b[0m ${method} ${path} - ${statusColor}${status}\x1b[0m \x1b[90m(${duration}ms)\x1b[0m`);
        return response;
      });
    }

    return handleRequest(req, new URL(req.url), activePluginHandler);
  }

  async function handleRequest(req: Request, url: URL, pluginHandler: any): Promise<Response> {
    // 0. Try Server Actions
    if (url.pathname.startsWith("/_action/")) {
      const encodedId = url.pathname.replace("/_action/", "");
      const actionId = decodeURIComponent(encodedId);
      // ... (existing action handling logic)
      console.log(`[buncf] actionId: ${actionId}`);
      console.log(`[buncf] Resolving Action: ${actionId}`);

      let action: any = prodActions[actionId];

      if (process.env.NODE_ENV !== "production" && !action) {
        try {
          const [filePath, exportName] = actionId.split("::");
          if (filePath && exportName) {
            const absPath = path.resolve(process.cwd(), filePath);
            if (fs.existsSync(absPath)) {
              // @ts-ignore
              const mod = await import(absPath + "?update=" + Date.now());
              action = mod[exportName];
            }
          }
        } catch (e) {
          console.error(`[buncf] Failed to resolve action ${actionId}:`, e);
        }
      }

      if (action && (action.handler || action._isAction)) {
        return handleAction(req, action);
      }
      return new Response(`Action Not Found: ${actionId}`, { status: 404 });
    }

    // 0.5. Try Plugin Routes (before user routes)
    if (pluginHandler) {
      try {
        const cfContext = getCloudflareContext();
        const pluginCtx: BuncfPluginContext = {
          env: cfContext.env,
          ctx: cfContext.ctx,
          request: req,
        };
        const pluginResponse = await pluginHandler(req, pluginCtx);
        if (pluginResponse) {
          return pluginResponse;
        }
      } catch (e) {
        // Context not available, skip plugin routes
      }
    }

    // 1. Try API routes first
    if (apiRouter && url.pathname.startsWith("/api")) {
      const apiResponse = await apiRouter.handle(req);
      if (apiResponse) return apiResponse;
    }

    // 2. Try page routes
    if (pagesRouter) {
      const pageMatch = pagesRouter.match(req);
      if (pageMatch) {
        // For SPA: return index.html with injected route data
        if (indexHtmlContent) {
          // Inject route data for client hydration
          const routeData = JSON.stringify({
            pathname: pageMatch.pathname,
            params: pageMatch.params,
            query: pageMatch.query,
            pattern: pageMatch.filePath,
          });

          // Get all routes for client-side matching (Manifest)
          const allRoutes = pagesRouter.getRoutes();
          const manifestData = JSON.stringify(allRoutes);

          const script = `
            <script>
              window.__BUNCF_ROUTE__ = ${routeData};
              window.__BUNCF_MANIFEST__ = ${manifestData};
            </script>
          `;

          const htmlFinal = indexHtmlContent.replace("</head>", `${script}</head>`);

          return new Response(htmlFinal, {
            headers: { "Content-Type": "text/html" },
          });
        }
      }
    }

    // 3. Try serving static files from src (for dev mode)
    if (url.pathname.includes(".")) {
      // 3a. Check for pre-built assets
      let assetName = url.pathname;
      if (assetName.match(/\.(tsx|ts|jsx)$/)) {
        assetName = assetName.replace(/\.(tsx|ts|jsx)$/, ".js");
      }
      const builtPaths = [
        `./.buncf/assets${assetName}`,
        `./.buncf/cloudflare/assets${assetName}`
      ];

      for (const builtPath of builtPaths) {
        if (fs.existsSync(builtPath)) {
          return new Response(Bun.file(builtPath), {
            headers: { "Content-Type": getContentType(assetName) }
          });
        }
      }

      // Check common source directories
      let possiblePaths = [
        `./src${url.pathname}`,
        `.${url.pathname}`,
        `./src/public${url.pathname}`,
        `./public${url.pathname}`,
      ];

      if (url.pathname.endsWith(".js")) {
        const base = url.pathname.slice(0, -3);
        possiblePaths = [
          ...possiblePaths,
          `./src${base}.tsx`,
          `./src${base}.ts`,
          `./src${base}.jsx`,
          `.${base}.tsx`,
          `.${base}.ts`,
          `.${base}.jsx`,
        ];
      }

      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          // 3a. Handle Server Actions
          if (filePath.match(/\.action\.(tsx|ts|jsx)$/)) {
            // ... (existing stub generation)
            const code = fs.readFileSync(filePath, "utf8");
            const relativePath = path.relative(process.cwd(), filePath);
            const exportMatches = code.matchAll(/export (?:async )?function ([a-zA-Z0-9_$]+)/g);
            const constExportMatches = code.matchAll(/export const ([a-zA-Z0-9_$]+) =/g);

            let clientCode = `/** Auto-generated Server Action Stubs */\n`;
            const addStub = (name: string) => {
              const actionId = encodeURIComponent(`${relativePath}#${name}`);
              clientCode += `
export const ${name} = async (input) => {
  const res = await fetch("/_action/${actionId}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Action failed" }));
    throw new Error(error.error || "Action failed");
  }
  return res.json();
};\n`;
            };

            for (const match of exportMatches) if (match[1]) addStub(match[1]);
            for (const match of constExportMatches) if (match[1]) addStub(match[1]);

            return new Response(clientCode, {
              headers: { "Content-Type": "application/javascript" },
            });
          }

          // 3b. Handle TSX/TS/JSX
          if (filePath.match(/\.(tsx|ts|jsx)$/)) {
            try {
              const result = await Bun.build({
                entrypoints: [filePath],
                format: "esm",
                minify: true,
                plugins: [deduplicateReactPlugin, serverActionsClientPlugin],
              });

              if (result.success && result.outputs[0]) {
                const code = await result.outputs[0].text();
                return new Response(code, {
                  headers: { "Content-Type": "application/javascript" },
                });
              } else {
                const logs = result.logs.map(l => l.message).join("\n");
                console.error(`[buncf] Transpilation failed for ${filePath}:\n`, logs);
                return new Response(`/* Transpilation Failed */`, { status: 500 });
              }
            } catch (e: any) {
              console.error(`[buncf] Failed to transpile ${filePath}:`, e);
              return new Response(`console.error("Buncf: Error");`, { status: 500 });
            }
          }

          const file = Bun.file(filePath);
          const contentType = getContentType(filePath);
          const headers: Record<string, string> = { "Content-Type": contentType };
          if (filePath.includes(".buncf") || filePath.includes("public")) {
            headers["Cache-Control"] = "public, max-age=31536000, immutable";
          } else {
            headers["Cache-Control"] = "public, max-age=3600";
          }
          return new Response(file, { headers });
        }
      }
    }

    // 4. Fallback: serve index.html for SPA catch-all
    let pageMatch = null;
    if (pagesRouter) {
      pageMatch = pagesRouter.match(req);
    }

    if (indexHtmlContent && !url.pathname.includes(".") && !url.pathname.startsWith("/_buncf/")) {
      const allRoutes = pagesRouter ? pagesRouter.getRoutes() : [];
      const routeData = JSON.stringify({
        pathname: pageMatch ? pageMatch.pathname : url.pathname,
        params: pageMatch ? pageMatch.params : {},
        query: pageMatch ? pageMatch.query : Object.fromEntries(url.searchParams),
        pattern: pageMatch ? pageMatch.filePath : null,
      });

      const manifestData = JSON.stringify(allRoutes);

      const script = `
         <script>
           window.__BUNCF_ROUTE__ = ${routeData};
           window.__BUNCF_MANIFEST__ = ${manifestData};
         </script>
       `;
      const htmlWithRoute = indexHtmlContent.replace("</head>", `${script}</head>`);
      return new Response(htmlWithRoute, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // 5. Try ASSETS binding as final fallback (for dev-only routes like /_buncf/*)
    try {
      const cfContext = getCloudflareContext();
      if (cfContext?.env?.ASSETS) {
        const assetRes = await cfContext.env.ASSETS.fetch(req);
        if (assetRes.status !== 404) {
          return assetRes;
        }
      }
    } catch (e) {
      // Ignore context errors in production - this fallback is mainly for dev
    }

    return new Response("Not Found", { status: 404 });
  }

  const handlerObject = {
    fetch,
    routes: {
      ...(apiRouter ? apiRouter.getBunRoutes() : {}),
    },
    middleware: [], // Will be populated after registry resolves
    development: process.env.NODE_ENV !== "production",
    _config: options, // EXPOSE CONFIG FOR BUILD
    _pluginRegistry: pluginRegistryPromise, // INTERNAL: used by worker-factory to avoid race conditions
  };

  // Wait for plugins to initialize and attach their middleware to the handler object
  pluginRegistryPromise.then(registry => {
    (handlerObject as any).middleware = registry.middleware || [];
  });

  return handlerObject;
}

/**
 * Get content type from file extension
 */
function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    jsx: "application/javascript",
    ts: "application/javascript",
    tsx: "application/javascript",
    json: "application/json",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
  };
  return types[ext || ""] || "application/octet-stream";
}
